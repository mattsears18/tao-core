<?php
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
 * Copyright (c) 2019 (original work) Open Assessment Technologies SA;
 *
 *
 */
namespace oat\tao\model\search\aggregator;

use oat\oatbox\service\ConfigurableService;
use oat\tao\model\search\ResultSet;
use oat\tao\model\search\Search;

/**
 * Class UnionSearchService
 * @package oat\tao\model\search\aggregator
 */
class UnionSearchService extends ConfigurableService implements UnionSearchInterface
{
    public function getInternalServices()
    {
        $services = $this->getOption('services');
        foreach ($services as $service) {
            $this->propagate($service);
        }

        $services[] = $this->getDefaultSearchService();

        return $services;
    }

    public function query($queryString, $type, $start = 0, $count = 10, $order = 'id', $dir = 'DESC')
    {
        $searchServicesList = $this->getInternalServices();
        $resultArray = [];
        foreach ($searchServicesList as $service) {
            /** @var ResultSet $result */
            $result = $service->query($queryString, $type, $start, $count, $order, $dir);
            $resultArray[] = $result->getArrayCopy();
        }
        $resultArray = array_merge(...$resultArray);

        return $this->prepareResultSetFromArray($resultArray);
    }

    private function prepareResultSetFromArray($resultArray = [])
    {
        return new ResultSet($resultArray, count($resultArray));
    }

    /**
     * getDefaultSearchService
     *
     * @return Search
     */
    private function getDefaultSearchService() : Search
    {
        /** @noinspection PhpIncompatibleReturnTypeInspection */
        return $this->getServiceLocator()->get(Search::SERVICE_ID);
    }
}
