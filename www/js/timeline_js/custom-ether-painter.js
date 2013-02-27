/*==================================================
 *  Patch: Custom Ether Interval Marker Layout
 * 	* Paints hours of the day for DateTime.DAY intervals.
 *==================================================
 */
 
Timeline.EtherIntervalMarkerLayout = function(timeline, band, theme, align, showLine) {
    
    var horizontal = timeline.isHorizontal();
    if (horizontal) {
        if (align == "Top") {
            this.positionDiv = function(div, offset) {
                div.style.left = offset + "px";
                div.style.top = "0px";
            };
        } else {
            this.positionDiv = function(div, offset) {
                div.style.left = offset + "px";
                div.style.bottom = "0px";
            };
        }
    } else {
        if (align == "Left") {
            this.positionDiv = function(div, offset) {
                div.style.top = offset + "px";
                div.style.left = "0px";
            };
        } else {
            this.positionDiv = function(div, offset) {
                div.style.top = offset + "px";
                div.style.right = "0px";
            };
        }
    }
    
    var markerTheme = theme.ether.interval.marker;
    var lineTheme = theme.ether.interval.line;
    var weekendTheme = theme.ether.interval.weekend;
    
    var stylePrefix = (horizontal ? "h" : "v") + align;
    var labelStyler = markerTheme[stylePrefix + "Styler"];
    var emphasizedLabelStyler = markerTheme[stylePrefix + "EmphasizedStyler"];
    var day = SimileAjax.DateTime.gregorianUnitLengths[SimileAjax.DateTime.DAY];
    
    this.createIntervalMarker = function(date, labeller, unit, markerDiv, lineDiv) {
        var offset = Math.round(band.dateToPixelOffset(date));

        if (showLine && unit != SimileAjax.DateTime.WEEK) {
            var divLine = timeline.getDocument().createElement("div");
            divLine.className = "timeline-ether-lines";

            if (lineTheme.opacity < 100) {
                SimileAjax.Graphics.setOpacity(divLine, lineTheme.opacity);
            }
            
            if (horizontal) {
				//divLine.className += " timeline-ether-lines-vertical";
				divLine.style.left = offset + "px";
            } else {
				//divLine.className += " timeline-ether-lines-horizontal";
                divLine.style.top = offset + "px";
            }
            lineDiv.appendChild(divLine);
        }
        if (unit == SimileAjax.DateTime.WEEK) {
            var firstDayOfWeek = theme.firstDayOfWeek;
            
            var saturday = new Date(date.getTime() + (6 - firstDayOfWeek - 7) * day);
            var monday = new Date(saturday.getTime() + 2 * day);
            
            var saturdayPixel = Math.round(band.dateToPixelOffset(saturday));
            var mondayPixel = Math.round(band.dateToPixelOffset(monday));
            var length = Math.max(1, mondayPixel - saturdayPixel);
            
            var divWeekend = timeline.getDocument().createElement("div");            
			divWeekend.className = 'timeline-ether-weekends'

            if (weekendTheme.opacity < 100) {
                SimileAjax.Graphics.setOpacity(divWeekend, weekendTheme.opacity);
            }
            
            if (horizontal) {				
                divWeekend.style.left = saturdayPixel + "px";
                divWeekend.style.width = length + "px";                
            } else {				
                divWeekend.style.top = saturdayPixel + "px";
                divWeekend.style.height = length + "px";                
            }
            lineDiv.appendChild(divWeekend);
        }
        
        
        
        // draw hour ticks
        if(unit == SimileAjax.DateTime.DAY){
        
        	var next_day = new Date(date.getTime() + 60*60*24*1000)
        	var hour_width = Math.round( (Math.round(band.dateToPixelOffset(next_day)) - offset)/24 );
        	var hour_off = offset
        	
        	var marker_gradient = [0,0,0,0,0,0,0,
        		'#8397A6',
        		'#759fbd',
        		'#629cc4',
        		'#4999d1',
        		'#2795e3',
        		'#0293fa'
        	]
        	
        	function hour_marker(off, h, i){
        		var mark = timeline.getDocument().createElement("div");
        		mark.className = 'timeline-x-hour-label'
        		mark.innerHTML = '<span>'+h+'</span>'
        		mark.style.bottom = '0px'
        		mark.style.left = off + 'px'
        		if(i > 6)
        			mark.style.color = marker_gradient[i]
        		return mark
        	}
        	
        	
        	hour_off += hour_width
        	
        	var paintLabels = band._bandInfo.params['paintLabels'] == true 
        	
        	for(var d=1; d<12; d++){
        		markerDiv.appendChild(
        			paintLabels ? hour_marker(hour_off, d+'am', d) : hour_marker(hour_off, '', d)
        		)
        		hour_off += hour_width
        	}
        	
        	markerDiv.appendChild(
        		paintLabels ? hour_marker(hour_off, '12', 12) : hour_marker(hour_off, '', 12)
        	)
        	hour_off += hour_width
        		
        	for(var d=1; d<12; d++){
        		markerDiv.appendChild(
        			paintLabels ? hour_marker(hour_off, d+'pm', 12 - d) : hour_marker(hour_off, '', 12 - d) 
        		)
        		hour_off += hour_width
        	}
        		
        }
        
        // draw week ticks
        if(unit == SimileAjax.DateTime.MONTH){
        	var next_month = new Date(date.getTime() + 60*60*24*30*1000)
        	var week_width = Math.round( (Math.round(band.dateToPixelOffset(next_month)) - offset)/4 )
        	var week_off = offset
        	
        	function week_marker(off){
        		var mark = timeline.getDocument().createElement("div");
        		mark.className = 'timeline-x-week-label'
        		mark.innerHTML = ''
        		mark.style.bottom = '0px'
        		mark.style.left = off + 'px'
        		return mark
        	}
        	
        	week_off += week_width
        	for(var w=0; w<3; w++){
        		markerDiv.appendChild(week_marker(week_off))
        		week_off += week_width
        	}
        }
        
        // draw month ticks
        if(unit == SimileAjax.DateTime.YEAR){
        	var next_year = new Date(date.getTime() + 60*60*24*365*1000)
        	var month_width = Math.round( (Math.round(band.dateToPixelOffset(next_year)) - offset)/12 )
        	var month_off = offset
        	
        	function month_marker(off, mo){
        		var mark = timeline.getDocument().createElement("div");
        		mark.className = 'timeline-x-month-label'
        		mark.innerHTML = '<span>'+mo+'</span>'
        		mark.style.bottom = '0px'
        		mark.style.left = off + 'px'
        		return mark
        	}
        	
        	month_off += month_width
        	var months = ['Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
        	for(var y=0; y<months.length; y++){
        		markerDiv.appendChild(month_marker(month_off, months[y]))
        		month_off += month_width
        	}
        }
        
        var label = labeller.labelInterval(date, unit);
        
        var div = timeline.getDocument().createElement("div");
        div.innerHTML = label.text;
        div.className = 'timeline-date-label'
	
	if(label.emphasized) div.className += ' timeline-date-label-em'
	this.positionDiv(div, offset);
	
	if(unit == SimileAjax.DateTime.DAY)
		div.style.paddingBottom='10px'
	
        
        markerDiv.appendChild(div);
        
        return div;
    };
};
