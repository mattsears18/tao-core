<?php

declare(strict_types=1);

namespace oat\tao\model\resources;

use common_exception_Error;
use core_kernel_classes_Class;
use core_kernel_classes_Resource;
use oat\generis\model\data\permission\PermissionInterface;
use oat\oatbox\service\ConfigurableService;
use oat\oatbox\session\SessionService;
use oat\oatbox\user\User;

class SecureResourceService extends ConfigurableService
{
    public const SERVICE_ID = 'tao/SecureResourceService';

    /**
     * @param core_kernel_classes_Class $resource
     *
     * @return core_kernel_classes_Resource[]
     * @throws common_exception_Error
     */
    public function getAllChildren(core_kernel_classes_Class $resource): array
    {
        $children = $resource->getInstances(true);
        $permissionService = $this->getPermissionProvider();

        $childrenIds = array_map(static function(core_kernel_classes_Resource $child) {
            return $child->getUri();
        }, $children);

        $permissions = $permissionService->getPermissions(
            $this->getUser(),
            $childrenIds
        );

        return array_filter(
            $children,
            static function (core_kernel_classes_Resource $child) use ($permissions) {
                return in_array('READ', $permissions[$child->getUri()], true);
            }
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
        return $this
            ->getServiceLocator()
            ->get(SessionService::SERVICE_ID)
            ->getCurrentUser();
    }
}
