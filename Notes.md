* ~~Implement multiple point dragging~~
* ~~implement selection of multiple points with coloring~~
* ~~implement rotation~~
* ~~color coding for tiles~~
* ~~refactor raycast and findContainingPoints~~
* ~~implement polygons~~
* ~~implement splitting of polygons~~
* ~~fill doesn´t work with split shapes because shapes around aren´t updated (4 nodes but should have 5)~~
* ~~fix fill if green shape is split all children green~~
* ~~fix selected don´t fill out if nodes were moved~~
* ~~parent should call move on all children and children gather the nodes and hand them up again so the parent can move
  the unique points.~~
* ~~shapes will only be generated when needed, because it is quite difficult to generate the child structure from the
  start. Also, there is no need for them before splitting since the invisible vectors do not provide additional
  information~~
* ~~spliting 2 shapes that are one shape vertical/horizontal apart splits the shape between~~
* ~~fix split additional lines~~
* ~~refactor mesh and canvas~~
* Graph coloring problem
* Chrome performance problems (Ok on Firefox)
* implement sidebar
* hover effect on nodes, make the nodes small and let them pop up when hovered
* make a history for ctrl z, maybe with localstorage
* implement save feature to allow the user to save the current grid and download the config
* distort image from vectors
* print vectors and lines to
* use setTransform instead of custom warp?
* submenues shouldn´t close after toggle/switch is triggered
* async subscribe task implementation for ImageWarper
* https://stackoverflow.com/questions/74101155/chrome-warning-willreadfrequently-attribute-set-to-true

* (?) polygons shouldn´t be able to overlap
* (?) scaling/rotation only for one polygon or for multiple (problem neighbor/ not neighbor)