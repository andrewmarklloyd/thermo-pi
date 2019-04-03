Requirements
------------
master node
	- must serve correct html/js for *all* nodes/types in cluster
		- /thermo serves form to control each thermostat
			- laundry: up, down
			- living: up, down
			- kitchen: up, down
			...
		- /sprinkler serves form to control each sprinkler in cluster
			- node1/zone1: on, off
			- node1/zone2: on, off
			- node2/zone1: on, off
			...
	- must have html/js and have no knowledge of the worker it's hosted on


worker node
	- checks in with master node with address and nodeType


Worker flow
-----------
worker--/register{nodeType:thermo,address:192.168.0.104}-->master
--addWorkerToArray--)
worker<--confirm--master


User flow
----------------
browser--/thermo-->master
--forEach thermoWorker--)
--buildHtmlJs--)
browser<--htmlJs
browser--/thermo/control{node:laundry,direction:down}-->master