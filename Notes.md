* Chrome performance problems (Ok on Firefox)
* ~~Implement multiple point dragging~~
* ~~implement selection of multiple points with coloring~~
* ~~implement rotation~~
* ~~color coding for tiles~~
* refactor raycast and findContainingPoints
* refactor mesh and canvas
* implement shapes
* implement splitting of shapes
* spliting 2 shapes that are one shape vertical/horizontal apart splits the shape between
* fill doesn´t work with split shapes because shapes around aren´t updated (4 nodes but should have 5)
* implement sidebar
* parent should call move on all children and children gather the nodes and hand them up again so the parent can move the unique points.
* shapes will only be generated when needed, because it is quite difficult to generate the child structure from the start. Also, there is no need for them before splitting since the invisible vectors do not provide additional information
* Graph coloring problem
* print vectors and lines to pdf