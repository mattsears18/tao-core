<?php

declare(strict_types=1);

/**
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; under version 2
 * of the License (non-upgradable).
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 *
 * Copyright (c) 2013-2020   (original work) Open Assessment Technologies SA (under the project TAO-PRODUCT);
 *
 */

namespace oat\tao\model\resources;

use common_cache_NotFoundException;
use common_exception_Error;
use core_kernel_classes_Class;
use core_kernel_classes_Resource;
use oat\generis\model\data\permission\PermissionInterface;
use oat\generis\model\OntologyRdfs;
use oat\oatbox\service\ConfigurableService;
use oat\oatbox\session\SessionService;
use oat\oatbox\user\User;

class SecureResourceService extends ConfigurableService implements SecureResourceServiceInterface
{
    /** @var User */
    private $user;

    /**
     * @param core_kernel_classes_Class $resource
     *
     * @return core_kernel_classes_Resource[]
     * @throws common_exception_Error
     * @throws common_cache_NotFoundException
     */
    public function getAllChildren(core_kernel_classes_Class $resource): array
    {
        $user = $this->getUser();

        $subClasses = $resource->getSubClasses(false);

        $accessibleInstances = [[]];

        $permissionService = $this->getPermissionProvider();

        if ($subClasses) {
            foreach ($subClasses as $subClass) {
                $classUri = $subClass->getUri();
                $classPermissions = $permissionService->getPermissions($user, [$classUri]);

                if ($this->hasAccess($classPermissions[$classUri])) {
                    $accessibleInstances[] = $this->getAllChildren($subClass);
                }
            }
        }

        return array_merge(
            $this->getInstances($resource),
            ...$accessibleInstances
        );
    }

    /**
     * @param core_kernel_classes_Class $class
     *
     * @return core_kernel_classes_Resource[]
     * @throws common_exception_Error
     */
    private function getInstances(core_kernel_classes_Class $class): array
    {
        $instances = $class->getInstances(false);

        if ($instances === null) {
            return [];
        }

        $childrenUris = array_map(
            static function (core_kernel_classes_Resource $child) {
                return $child->getUri();
            },
            $instances
        );

        $permissions = $this->getPermissionProvider()->getPermissions(
            $this->getUser(),
            $childrenUris
        );

        $accessibleInstances = [];

        foreach ($instances as $child) {
            $uri = $child->getUri();
            if ($this->hasAccess($permissions[$uri])) {
                $accessibleInstances[$uri] = $child;
            }
        }

        return $accessibleInstances;
    }

    private function hasAccess(array $permissions, array $permissionsToCheck = ['READ']): bool
    {
        return
            $permissions === [PermissionInterface::RIGHT_UNSUPPORTED]
            || empty(array_diff($permissionsToCheck, $permissions));
    }

    /**
     * @param string[] $resourceUris
     * @param string[] $permissionsToCheck
     *
     * @throws common_exception_Error
     */
    private function validatePermissions(array $resourceUris, array $permissionsToCheck): void
    {
        $permissionService = $this->getPermissionProvider();

        $permissions = $permissionService->getPermissions(
            $this->getUser(),
            $resourceUris
        );

        foreach ($permissions as $uri => $permission) {
            if (
                empty($permission)
                || !$this->hasAccess($permission, $permissionsToCheck)
            ) {
                throw new ResourceAccessDeniedException(
                    sprintf('Access to resource %s is forbidden', $uri)
                );
            }
        }
    }

    /**
     * @param core_kernel_classes_Resource[] $resources
     * @param string[]                       $permissionsToCheck
     *
     * @throws common_exception_Error
     */
    public function validateResourcesPermissions(iterable $resources, array $permissionsToCheck): void
    {
        foreach ($resources as $resource) {
            $this->validateResourcePermissions($resource, $permissionsToCheck);
        }
    }

    /**
     * @param core_kernel_classes_Resource|string $resource
     * @param array                               $permissionsToCheck
     *
     * @throws common_exception_Error
     */
    public function validateResourcePermissions($resource, array $permissionsToCheck): void
    {
        $permissionService = $this->getPermissionProvider();

        if (is_string($resource)) {
            $resource = new core_kernel_classes_Resource($resource);
        }

        $resourceUri = $resource->getUri();
        $permissions = $permissionService->getPermissions($this->getUser(), [$resourceUri]);

        if (!$this->hasAccess($permissions[$resourceUri], $permissionsToCheck)) {
            throw new ResourceAccessDeniedException(
                sprintf('Access to resource %s is forbidden', $resourceUri)
            );
        }

        if (!$resource->isClass()) {
            $resourceParents = $resource->getTypes();
            /** @var core_kernel_classes_Class $parent */
            $parent = current($resourceParents);
        } else {
            $parent = $resource;
        }

        $parentUris = $this->getParentUris($parent);

        $this->validatePermissions($parentUris, $permissionsToCheck);
    }

    private function getParentUris(core_kernel_classes_Class $parent)
    {
        $subClassesOfParent = $parent->getPropertyValues(
            $parent->getProperty(OntologyRdfs::RDFS_SUBCLASSOF)
        );

        $parents = [$parent];

        if (!in_array(self::UNDER_ROOT_URI, $subClassesOfParent, true)) {
            while ($parentList = $parent->getParentClasses(false)) {
                $parent = current($parentList);
                if ($parent->getUri() === self::UNDER_ROOT_URI) {
                    break;
                }
                $parents[] = $parent;
            }
        }

        return array_map(
            static function (core_kernel_classes_Class $class) {
                return $class->getUri();
            },
            $parents
        );
    }

    private function getPermissionProvider(): PermissionInterface
    {
        return $this->getServiceLocator()->get(PermissionInterface::SERVICE_ID);
    }

    /**
     * @return User
     *
     * @throws common_exception_Error
     */
    private function getUser(): User
    {
        if ($this->user === null) {
            $this->user = $this
                ->getServiceLocator()
                ->get(SessionService::SERVICE_ID)
                ->getCurrentUser();
        }

        return $this->user;
    }
}
