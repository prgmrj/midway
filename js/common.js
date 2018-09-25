var map, ps, infowindow, tempmarker;
var markers = []; // 검색 마커
var points = []; // 포인트 마커
var pointCnt = 0;

$(window).on('load', init);

function init(){ // 초기화
	var container = document.getElementById('map');
	
	map = new daum.maps.Map(container, { // 지도 생성
		center: new daum.maps.LatLng(37.541, 126.986), // 서울 중심 좌표
		level: 7
	});	
	ps = new daum.maps.services.Places(); // 장소 검색 생성	
	infowindow = new daum.maps.InfoWindow({ zIndex: 1 }); // 정보창 생성
    
	tempmarker = new daum.maps.Marker(); 
	
	daum.maps.event.addListener(map, 'click', function(mouseEvent) {  
	    
	    // 클릭한 위도, 경도 정보를 가져옵니다 
	    var latlng = mouseEvent.latLng; 
	    
	    // 마커 위치를 클릭한 위치로 옮깁니다
	    tempmarker.setPosition(latlng);
	    
	    setPointList(latlng);
	});
}

function zoomIn(){ // 확대
    map.setLevel(map.getLevel() - 1);
}

function zoomOut(){ // 축소
    map.setLevel(map.getLevel() + 1);
}

function searchPlaces(){ // 정소 검색 submit
	var keyword = document.getElementById('search_input').value; // input

	if (!keyword.replace(/^\s+|\s+$/g, '')){
		alert('주소 또는 키워드를 입력해주세요.');
        return false;
	}
	ps.keywordSearch(keyword, placesSearchCB); // 검색
}

function placesSearchCB(data, status, pagination) {
    if (status === daum.maps.services.Status.OK) {
    	$('#search_wrap').addClass('_searching');
        displayPlaces(data);
        displayPagination(pagination);
    } else if (status === daum.maps.services.Status.ZERO_RESULT) {
        alert('검색 결과가 존재하지 않습니다.');
        return;
    } else if (status === daum.maps.services.Status.ERROR) {
        alert('검색 결과 중 오류가 발생했습니다.');
        return;
    }
}

function displayPlaces(places) { // 장소 마킹
    var listEl = document.getElementById('search_list'), 
    	menuEl = document.getElementById('search_wrap'),
    	fragment = document.createDocumentFragment(), 
    	bounds = new daum.maps.LatLngBounds(), 
    	listStr = '';
    
    removeAllChildNods(listEl);
    removeMarker();
    
    for ( var i=0; i<places.length; i++ ) {
        var placePosition = new daum.maps.LatLng(places[i].y, places[i].x),
            marker = addMarker(placePosition, i), 
            itemEl = getListItem(i, places[i]); // 검색 결과 항목 Element를 생성합니다

        // 검색된 장소 위치를 기준으로 지도 범위를 재설정하기위해
        // LatLngBounds 객체에 좌표를 추가합니다
        bounds.extend(placePosition);

        // 마커와 검색결과 항목에 mouseover 했을때
        // 해당 장소에 인포윈도우에 장소명을 표시합니다
        // mouseout 했을 때는 인포윈도우를 닫습니다
        (function(marker, title) {
            daum.maps.event.addListener(marker, 'mouseover', function() {
                displayInfowindow(marker, title);
            });

            daum.maps.event.addListener(marker, 'mouseout', function() {
                infowindow.close();
            });
            
            daum.maps.event.addListener(marker, 'click', function() {
            	setPointList(marker.getPosition());
            });

            itemEl.onmouseover =  function () {
                displayInfowindow(marker, title);
            };

            itemEl.onmouseout =  function () {
                infowindow.close();
            };
            
            itemEl.onclick =  function () {
            	setPointList(marker.getPosition());
            };
        })(marker, places[i].place_name);

        fragment.appendChild(itemEl);
    }

    // 검색결과 항목들을 검색결과 목록 Elemnet에 추가합니다
    listEl.appendChild(fragment);
    menuEl.scrollTop = 0;

    // 검색된 장소 위치를 기준으로 지도 범위를 재설정합니다
    map.setBounds(bounds);
}

// 검색결과 항목을 Element로 반환하는 함수입니다
function getListItem(index, places) {

    var el = document.createElement('li'),
    itemStr = '<span class="markerbg marker_' + (index+1) + '"></span>' +
                '<div class="info">' +
                '   <h5>' + places.place_name + '</h5>';

    if (places.road_address_name) {
        itemStr += '    <span>' + places.road_address_name + '</span>' +
                    '   <span class="jibun gray">' +  places.address_name  + '</span>';
    } else {
        itemStr += '    <span>' +  places.address_name  + '</span>'; 
    }
                 
      itemStr += '  <span class="tel">' + places.phone  + '</span>' +
                '</div>';           

    el.innerHTML = itemStr;
    el.className = 'item';

    return el;
}

// 마커를 생성하고 지도 위에 마커를 표시하는 함수입니다
function addMarker(position, idx, title) {
    var imageSrc = 'http://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_number_blue.png', // 마커 이미지 url, 스프라이트 이미지를 씁니다
        imageSize = new daum.maps.Size(36, 37),  // 마커 이미지의 크기
        imgOptions =  {
            spriteSize : new daum.maps.Size(36, 691), // 스프라이트 이미지의 크기
            spriteOrigin : new daum.maps.Point(0, (idx*46)+10), // 스프라이트 이미지 중 사용할 영역의 좌상단 좌표
            offset: new daum.maps.Point(13, 37) // 마커 좌표에 일치시킬 이미지 내에서의 좌표
        },
        markerImage = new daum.maps.MarkerImage(imageSrc, imageSize, imgOptions),
            marker = new daum.maps.Marker({
            position: position, // 마커의 위치
            image: markerImage 
        });

    marker.setMap(map); // 지도 위에 마커를 표출합니다
    markers.push(marker);  // 배열에 생성된 마커를 추가합니다

    return marker;
}

// 지도 위에 표시되고 있는 마커를 모두 제거합니다
function removeMarker() {
    for ( var i = 0; i < markers.length; i++ ) {
        markers[i].setMap(null);
    }   
    markers = [];
}

// 검색결과 목록 하단에 페이지번호를 표시는 함수입니다
function displayPagination(pagination) {
    var paginationEl = document.getElementById('pagination'),
        fragment = document.createDocumentFragment(),
        i; 

    // 기존에 추가된 페이지번호를 삭제합니다
    while (paginationEl.hasChildNodes()) {
        paginationEl.removeChild (paginationEl.lastChild);
    }

    for (i=1; i<=pagination.last; i++) {
        var el = document.createElement('a');
        el.href = "#";
        el.innerHTML = i;

        if (i===pagination.current) {
            el.className = 'on';
        } else {
            el.onclick = (function(i) {
                return function() {
                    pagination.gotoPage(i);
                }
            })(i);
        }

        fragment.appendChild(el);
    }
    paginationEl.appendChild(fragment);
}

// 검색결과 목록 또는 마커를 클릭했을 때 호출되는 함수입니다
// 인포윈도우에 장소명을 표시합니다
function displayInfowindow(marker, title) {
    var content = '<div class="info_custom" style="padding:5px;z-index:1;">' + title + '</div>';

    infowindow.setContent(content);
    infowindow.open(map, marker);
}

 // 검색결과 목록의 자식 Element를 제거하는 함수입니다
function removeAllChildNods(el) {   
    while (el.hasChildNodes()) {
        el.removeChild (el.lastChild);
    }
}

var addingPointPosition;

function setPointList(pointPosition){
    if (confirm('지점 리스트에 추가하시겠습니까?')){
    	addingPointPosition = pointPosition;
    	$('body').addClass('infoedit');
    	$('#info_input').focus();
    } else{
    	return false;
    }
}

function addPoint(){
	addPointMarker(addingPointPosition, pointCnt);
	pointCnt++;
	$('#points_list').append('<li><span class="title">'+$('#info_input').val()+'</span><span class="del">x</span></li>')
	$('#info_input').val('');
	$('body').removeClass('infoedit');
}

function addPointMarker(position, idx, title) {
    var imageSrc = '../img/marker_number_red.png', // 마커 이미지 url, 스프라이트 이미지를 씁니다
        imageSize = new daum.maps.Size(36, 37),  // 마커 이미지의 크기
        imgOptions =  {
            spriteSize : new daum.maps.Size(36, 691), // 스프라이트 이미지의 크기
            spriteOrigin : new daum.maps.Point(0, (idx*46)+10), // 스프라이트 이미지 중 사용할 영역의 좌상단 좌표
            offset: new daum.maps.Point(13, 37) // 마커 좌표에 일치시킬 이미지 내에서의 좌표
        },
        markerImage = new daum.maps.MarkerImage(imageSrc, imageSize, imgOptions),
            marker = new daum.maps.Marker({
            position: position, // 마커의 위치
            image: markerImage 
        });

    marker.setMap(map); // 지도 위에 마커를 표출합니다
    points.push(marker);  // 배열에 생성된 마커를 추가합니다

    return marker;
}

$(document).on('click', '#info_cancel', cancelAddPoint);
$(document).on('click', '#points_list > li > span.del', delPoint);
$(document).on('click', '#btn_calc', calcPoint);

function calcPoint(){
	var lat = 0;
	var lng = 0;
	var latAvg, lngAvg;
	
	for (var i=0;i<points.length;i++){
		lat += points[i].getPosition().getLat();
		lng += points[i].getPosition().getLng();
	}
	
	latAvg = lat / points.length;
	lngAvg = lng / points.length;
	
	var circle = new daum.maps.Circle({
	    center : new daum.maps.LatLng(latAvg, lngAvg),  // 원의 중심좌표 입니다 
	    radius: 200, // 미터 단위의 원의 반지름입니다 
	    strokeWeight: 5, // 선의 두께입니다 
	    strokeColor: '#000', // 선의 색깔입니다
	    strokeOpacity: 1, // 선의 불투명도 입니다 1에서 0 사이의 값이며 0에 가까울수록 투명합니다
	    strokeStyle: 'dashed', // 선의 스타일 입니다
	    fillColor: '#000', // 채우기 색깔입니다
	    fillOpacity: 0.5  // 채우기 불투명도 입니다   
	}); 
	
	circle.setMap(map);
	
	var moveLatLon = new daum.maps.LatLng(latAvg, lngAvg);
	 
	map.setCenter(moveLatLon);
	
	console.log()
}

function delPoint(){
	if (confirm('해당 지점을 삭제할까요?')){
		var $point = $(this).parents('li');
		$point.remove();
		points.splice($point.index(), 1);
    } else{
    	return false;
    }	
}

function cancelAddPoint(){
	$('#info_input').val('');
	$('body').removeClass('infoedit');
}
