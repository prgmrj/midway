var map; // map 객체

$(window).on('load', init); // 초기화

function init(){
	var container = document.getElementById('map');
	map = new daum.maps.Map(container, {
		center: new daum.maps.LatLng(37.541, 126.986), // 서울 좌표
		level: 7
	});
}