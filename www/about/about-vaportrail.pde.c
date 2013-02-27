
String canvas_id = "about_sketch";

// Setup the Processing Canvas
void setup(){
  // bootstrap page with
  size( 960, 500 );
  noLoop(); 
}


void draw_box(x, y, width, height){
	rect(x, y, width, height, 10);
}

void draw_box_label(x, y, label){
	textSize(15);
	text(label, x + 10, y + 20);
}

void draw_blue_box(x, y, width, height, label){

	fill(97, 97, 255);
	stroke(34, 81, 212); 
	draw_box(x, y, width, height);
	fill(12, 32, 87);
	draw_box_label(x, y, label);
}

void draw_yellow_box(x, y, width, height, label){

	fill(225, 237, 0);
	stroke(196, 190, 14); 
	draw_box(x, y, width, height);
	fill(133, 106, 0);
	draw_box_label(x, y, label);
}

void draw_green_box(x, y, width, height, label){

	fill(102, 209, 2);
	stroke(75, 145, 1); 
	draw_box(x, y, width, height);
	fill(38, 77, 2);
	draw_box_label(x, y, label);
}

// Main draw loop
void draw(){
  
  background(255);
  strokeWeight(1);
  
  // Draw circle
  draw_blue_box(130, 50, 200, 60, "vaportrail.nss.cs.ubc.ca");
  draw_yellow_box(380, 50, 200, 60, "storage.provider.io");
  draw_green_box(630, 50, 200, 60, "My Web Browser");
  
}


// Set circle's next destination
void mouseMoved(){
 
}
