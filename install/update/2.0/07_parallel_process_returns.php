<?//set the access control mode of every activity of every delivery and test processes to the new mode "role restricted user delivery"$root_path = dirname(__FILE__).'/../../../../';Bootstrap::loadConstants('taoDelivery');Bootstrap::loadConstants('wfEngine');core_control_FrontController::connect(SYS_USER_LOGIN, SYS_USER_PASS, DATABASE_NAME);error_reporting(E_ALL);$deliveryAuthoring = tao_models_classes_ServiceFactory::get('taoDelivery_models_classes_DeliveryAuthoringService');$deliveryClass = new core_kernel_classes_Class(TAO_DELIVERY_CLASS);$propDeliveryProcess = new core_kernel_classes_Property(TAO_DELIVERY_PROCESS);$propActivitiesACLmode = new core_kernel_classes_Property(PROPERTY_ACTIVITIES_ACL_MODE);$deliveryACLmode = new core_kernel_classes_Resource(INSTANCE_ACL_ROLE_RESTRICTED_USER_DELIVERY);//edit the access control mode of each activity of all delivery processes (compiled delivery) to the new oneforeach($deliveryClass->getInstances(true) as $delivery){	$deliveryProcess = $delivery->getOnePropertyValue($propDeliveryProcess);	if(!is_null($deliveryProcess)){		foreach($deliveryAuthoring->getActivitiesByProcess($deliveryProcess) as $activity){			$activity->editPropertyValues($propActivitiesACLmode, $deliveryACLmode->uriResource);		}	}}//edit the access control mode of each activity (item) of all tests$testClass = new core_kernel_classes_Class(TAO_TEST_CLASS);$propTestContent = new core_kernel_classes_Property(TEST_TESTCONTENT_PROP);foreach($testClass->getInstances(true) as $test){	$testContent = $test->getOnePropertyValue($propTestContent);	if(!is_null($testContent)){		foreach($deliveryAuthoring->getActivitiesByProcess($testContent) as $activity){			$activity->editPropertyValues($propActivitiesACLmode, $deliveryACLmode->uriResource);		}	}}?>