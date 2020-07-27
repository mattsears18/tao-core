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
 * Copyright (c) 2020 (original work) Open Assessment Technologies SA;
 */

declare(strict_types=1);

use oat\generis\test\MockObject;
use oat\generis\test\TestCase;
use oat\tao\model\dto\OldProperty;
use oat\tao\model\event\ClassPropertiesChangedEvent;
use oat\tao\model\listener\ClassPropertiesChangedListener;
use oat\tao\model\search\tasks\RenameIndexProperties;
use oat\tao\model\taskQueue\QueueDispatcherInterface;

class ClassPropertiesChangedListenerTest extends TestCase
{
    /** @var QueueDispatcherInterface|MockObject */
    private $queueDispatcher;

    /** @var ClassPropertiesChangedListener */
    private $sut;

    protected function setUp(): void
    {
        parent::setUp();

        $this->sut = new ClassPropertiesChangedListener();

        $this->queueDispatcher = $this->createMock(QueueDispatcherInterface::class);
        $this->sut->setServiceLocator(
            $this->getServiceLocatorMock(
                [
                    QueueDispatcherInterface::SERVICE_ID => $this->queueDispatcher
                ]
            )
        );
    }

    public function testRenameClassProperties(): void {
        $this->queueDispatcher->expects($this->once())
            ->method('createTask')
            ->with(
                new RenameIndexProperties(),
                [
                    [
                        'uri' => null,
                        'oldLabel' => 'test',
                        'oldPropertyType' => null,
                    ]
                ],
                'Updating search index',
                null,
                false
            );

        $this->sut->renameClassProperties(
            new ClassPropertiesChangedEvent(
                [
                    [
                        'oldProperty' => new OldProperty('test', null),
                        'property' => $this->createMock(core_kernel_classes_Property::class)
                    ]
                ]
            )
        );
    }

    /**
     * @dataProvider provideInvalidData
     */
    public function testExceptionWhenCallingRenameClassProperties(array $property): void
    {
        $this->expectException(RuntimeException::class);

        $this->queueDispatcher->expects($this->never())
            ->method('createTask');

        $this->sut->renameClassProperties(
            new ClassPropertiesChangedEvent(
                [
                    $property
                ]
            )
        );
    }

    public function provideInvalidData(): array
    {
        return [
            'with no old property' => [
                'properties' => [
                    'property' => $this->createMock(core_kernel_classes_Property::class)
                ]
            ],
            'with no property' => [
                'properties' => [
                    'oldProperty' => new OldProperty('test', null)
                ]
            ],
        ];
    }
}