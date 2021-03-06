/*!
 * nano-g v0.1
 * https://github.com/Hanul/nano-g
 *
 * Released under the MIT license
 * https://github.com/Hanul/nano-g/blob/master/LICENSE
 */
(() => {
	let global = window;
	
	// 변수들
	global.delta_time = 0;
	global.game_width = undefined;
	global.game_height = undefined;
	global.canvas_width = undefined;
	global.canvas_height = undefined;
	global.canvas_ratio = undefined;
	
	// 캔버스 생성
	let canvas = document.createElement('canvas');
	let context = canvas.getContext('2d');
	
	canvas.style.position = 'fixed';
	canvas.style.zIndex = -1;
	
	document.body.appendChild(canvas);
	
	let resize = () => {
		
		global.window_width = document.documentElement.clientWidth;
		global.window_height = global.innerHeight;
		
		if (game_width !== undefined) {
			canvas_width = game_width;
		} else {
			canvas_width = window_width;
		}
		
		if (game_height !== undefined) {
			canvas_height = game_height;
		} else {
			canvas_height = window_height;
		}
		
		let widthRatio = window_width / canvas_width;
		let heightRatio = window_height / canvas_height;
		
		if (widthRatio < heightRatio) {
			canvas_ratio = widthRatio;
		} else {
			canvas_ratio = heightRatio;
		}
		
		if (game_width === undefined) {
			canvas_width /= canvas_ratio;
		}
		
		if (game_height === undefined) {
			canvas_height /= canvas_ratio;
		}
		
		canvas.style.width = (canvas_width * canvas_ratio) + 'px';
		canvas.style.height = (canvas_height * canvas_ratio) + 'px';
		
		canvas.style.left = (window_width - canvas_width * canvas_ratio) / 2 + 'px';
		canvas.style.top = (window_height - canvas_height * canvas_ratio) / 2 + 'px';
		
		canvas.width = canvas_width * devicePixelRatio;
		canvas.height = canvas_height * devicePixelRatio;
		
		global.mouse_x = window_width / 2 * devicePixelRatio / canvas_ratio;
		global.mouse_y = window_height / 2 * devicePixelRatio / canvas_ratio;
	};
	
	resize();
	global.addEventListener('resize', resize, false);
	
	// 사운드 관련
	
	// audiocontext-polyfill.js
	(function(window,undefined){"use strict";window.AudioContext=window.AudioContext||window.webkitAudioContext;if(window.AudioContext!==undefined){window.OfflineAudioContext=window.OfflineAudioContext||window.webkitOfflineAudioContext;var Proto=AudioContext.prototype;var tmpctx=new AudioContext;var isStillOld=function(normative,old){return normative===undefined&&old!==undefined};var bufProto=tmpctx.createBufferSource().constructor.prototype;if(isStillOld(bufProto.start,bufProto.noteOn)||isStillOld(bufProto.stop,bufProto.noteOff)){var nativeCreateBufferSource=Proto.createBufferSource;Proto.createBufferSource=function createBufferSource(){var returnNode=nativeCreateBufferSource.call(this);returnNode.start=returnNode.start||returnNode.noteOn;returnNode.stop=returnNode.stop||returnNode.noteOff;return returnNode}}if(typeof tmpctx.createOscillator==="function"){var oscProto=tmpctx.createOscillator().constructor.prototype;if(isStillOld(oscProto.start,oscProto.noteOn)||isStillOld(oscProto.stop,oscProto.noteOff)){var nativeCreateOscillator=Proto.createOscillator;Proto.createOscillator=function createOscillator(){var returnNode=nativeCreateOscillator.call(this);returnNode.start=returnNode.start||returnNode.noteOn;returnNode.stop=returnNode.stop||returnNode.noteOff;return returnNode}}}if(Proto.createGain===undefined&&Proto.createGainNode!==undefined){Proto.createGain=Proto.createGainNode}if(Proto.createDelay===undefined&&Proto.createDelayNode!==undefined){Proto.createDelay=Proto.createGainNode}if(Proto.createScriptProcessor===undefined&&Proto.createJavaScriptNode!==undefined){Proto.createScriptProcessor=Proto.createJavaScriptNode}var is_iOS=navigator.userAgent.indexOf("like Mac OS X")!==-1;if(is_iOS){var OriginalAudioContext=AudioContext;window.AudioContext=function AudioContext(){var iOSCtx=new OriginalAudioContext;var body=document.body;var tmpBuf=iOSCtx.createBufferSource();var tmpProc=iOSCtx.createScriptProcessor(256,1,1);body.addEventListener("touchstart",instantProcess,false);function instantProcess(){tmpBuf.start(0);tmpBuf.connect(tmpProc);tmpProc.connect(iOSCtx.destination)}tmpProc.onaudioprocess=function(){tmpBuf.disconnect();tmpProc.disconnect();body.removeEventListener("touchstart",instantProcess,false);tmpProc.onaudioprocess=null};return iOSCtx}}}})(window);
	let audioContext = new AudioContext();
	
	// 이벤트 관련
	
	let setMousePosition = (e) => {
		if (e.touches !== undefined && e.touches[0] !== undefined) {
			global.mouse_x = (e.touches[0].pageX - window_width / 2) / canvas_ratio;
			global.mouse_y = (e.touches[0].pageY - window_height / 2) / canvas_ratio;
		} else {
			global.mouse_x = (e.pageX - window_width / 2) / canvas_ratio;
			global.mouse_y = (e.pageY - window_height / 2) / canvas_ratio;
		}
	};
	
	let isMouseDown = false;
	global.addEventListener('mousedown', (e) => {
		isMouseDown = true;
		setMousePosition(e);
	}, false);
	global.addEventListener('mouseup', (e) => {
		isMouseDown = false;
		setMousePosition(e);
	}, false);
	global.addEventListener('mousemove', (e) => {
		setMousePosition(e);
	}, false);
	
	let isTouching = false;
	global.addEventListener('touchstart', (e) => {
		isTouching = true;
		setMousePosition(e);
	}, false);
	global.addEventListener('touchend', (e) => {
		if (e.touches.length === 0) {
			isTouching = false;
		}
		setMousePosition(e);
	}, false);
	
	let keyDowns = {};
	global.addEventListener('keydown', (e) => {
		keyDowns[e.key.toLowerCase()] = true;
	}, false);
	global.addEventListener('keyup', (e) => {
		delete keyDowns[e.key.toLowerCase()];
	}, false);
	
	let logics = [];
	
	// 게임 로직 등록
	global.g = (logic) => {
		logics.push(logic);
	};
	
	let images = {};
	let audioSources = {};
	let audioGainNodes = {};
	
	// 무언가를 그린다.
	global.draw = (target, option) => {
		
		let x;
		let y;
		let width;
		let height;
		let flip_x;
		let flip_y;
		let color;
		let alpha;
		let angle;
		
		// 옵션 초기화
		if (option !== undefined) {
			x = option.x;
			y = option.y;
			width = option.width;
			height = option.height;
			flip_x = option.flip_x;
			flip_y = option.flip_y;
			color = option.color;
			alpha = option.alpha;
			angle = option.angle;
		}
		
		if (x === undefined) {
			x = 0;
		}
		if (y === undefined) {
			y = 0;
		}
		if (color === undefined) {
			color = '#000000';
		}
		if (alpha === undefined) {
			alpha = 1;
		}
		if (angle === undefined) {
			angle = 0;
		}
		
		context.save();
		
		context.translate(x, y);
		context.rotate(angle * Math.PI / 180);
		context.globalAlpha = alpha;
		
		if (flip_x === true || flip_y === true) {
			context.scale(flip_x === true ? -1 : 1, flip_y === true ? -1 : 1);
		}
		
		// 사각형
		if (target === 'rect') {
			context.beginPath();
			context.rect(-width / 2, -height / 2, width, height);
			context.fillStyle = color;
			context.fill();
			context.closePath();
		}
		
		// 원
		else if (target === 'circle') {
			context.beginPath();
			context.ellipse(0, 0, width / 2, height / 2, 0, 0, 2 * Math.PI);
			context.fillStyle = color;
			context.fill();
			context.closePath();
		}
		
		// 이미지
		else if (option === undefined || (option.size === undefined && option.font === undefined)) {
			let image = images[target];
			if (image === undefined) {
				images[target] = image = new Image();
				image.src = target;
			}
			if (image.naturalWidth !== 0) {
				let drawWidth = width !== undefined ? width : image.width;
				let drawHeight = height !== undefined ? height : image.height;
				context.drawImage(image, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
			}
		}
		
		// 텍스트
		else {
			context.font = (option.style === undefined ? '' : option.style + ' ') + option.size + 'px ' + (option.font === undefined ? 'Arial' : option.font);
			context.fillStyle = color;
			context.textAlign = 'center';
			context.textBaseline = 'middle';
			context.fillText(target, 0, 0);
		}
		
		context.restore();
	};
	
	// 무언가를 재생시킨다.
	global.play = (src, option) => {
		
		let request = new XMLHttpRequest();
		request.open('GET', src, true);
		request.responseType = 'arraybuffer';
	
		request.onload = () => {
	
			audioContext.decodeAudioData(request.response, (buffer) => {
				
				if (audioSources[src] !== undefined) {
					stop(src);
				}
				
				audioSources[src] = source = audioContext.createBufferSource();
				audioGainNodes[src] = gainNode = audioContext.createGain();
	
				gainNode.connect(audioContext.destination);
				gainNode.gain.setTargetAtTime(option !== undefined && option.volume !== undefined ? option.volume : 0.8, 0, 0);
	
				source.buffer = buffer;
				source.connect(gainNode);
				if (option !== undefined && option.loop !== undefined) {
					source.loop = option.loop;
				}
				
				source.start(0, 0);
				
				delayed = undefined;
				
				if (option !== undefined && option.loop !== true) {
					source.onended = () => {
						
						source.stop(0);
						source.disconnect();
						source = undefined;
	
						gainNode.disconnect();
						gainNode = undefined;
	
						buffer = undefined;
						delayed = undefined;
					};
				}
			});
		};
		request.send();
	};
	
	// 무언가의 재생을 멈춘다.
	global.stop = (src) => {
		
		source = audioSources[src];
		gainNode = audioGainNodes[src];
		
		if (source !== undefined) {
			
			source.stop(0);
			source.disconnect();

			gainNode.disconnect();
		}
	};
	
	// 충돌을 체크한다.
	global.check_collision = (target, option) => {
		
		let x1 = option.x1;
		if (x1 === undefined) {
			x1 = 0;
		}
		let y1 = option.y1;
		if (y1 === undefined) {
			y1 = 0;
		}
		let width1 = option.width1;
		let height1 = option.height1;
		let angle1 = option.angle1;
		if (angle1 === undefined) {
			angle1 = 0;
		}
		let sin1 = angle1 === 0 ? 0 : Math.sin(angle1 * Math.PI / 180);
		let cos1 = angle1 === 0 ? 1 : Math.cos(angle1 * Math.PI / 180);
		
		let x2 = option.x2;
		if (x2 === undefined) {
			x2 = 0;
		}
		let y2 = option.y2;
		if (y2 === undefined) {
			y2 = 0;
		}
		let width2 = option.width2;
		let height2 = option.height2;
		let angle2 = option.angle2;
		if (angle2 === undefined) {
			angle2 = 0;
		}
		let sin2 = angle2 === 0 ? 0 : Math.sin(angle2 * Math.PI / 180);
		let cos2 = angle2 === 0 ? 1 : Math.cos(angle2 * Math.PI / 180);
		
		if (target === 'point_rect') {
			return checkPointInRect(
				x1, y1,
				
				x2, y2,
				width2, height2,
				1, 1,
				sin2, cos2);
		}
		
		else if (target === 'point_circle') {
			return checkPointInCircle(
				x1, y1,
				
				x2, y2,
				width2, height2,
				1, 1,
				sin2, cos2);
		}
		
		else if (target === 'rect_rect') {
			return checkRectRect(
				x1, y1,
				width1, height1,
				1, 1,
				sin1, cos1,
				
				x2, y2,
				width2, height2,
				1, 1,
				sin2, cos2);
		}
		
		else if (target === 'rect_circle') {
			return checkRectCircle(
				x1, y1,
				width1, height1,
				1, 1,
				sin1, cos1,
				
				x2, y2,
				width2, height2,
				1, 1,
				sin2, cos2);
		}
		
		else if (target === 'circle_circle') {
			return checkCircleCircle(
				x1, y1,
				width1, height1,
				1, 1,
				sin1, cos1,
				
				x2, y2,
				width2, height2,
				1, 1,
				sin2, cos2);
		}
	};
	
	// 게임으로의 입력을 체크한다.
	global.check_input = (target) => {
		if (target === 'mouse' && (isMouseDown === true || isTouching === true)) {
			return true;
		} else {
			return keyDowns[target];
		}
	};
	
	// 프레임마다 실행
	let beforeTime;
	let step;
	requestAnimationFrame(step = (now) => {
		
		if (beforeTime === undefined) {
			beforeTime = performance.now() / 1000;
			resize();
		}
		
		let time = now / 1000;
		delta_time = time - beforeTime;
		
		if (delta_time > 0.03) {
			delta_time = 0.03;
		}
		
		if (delta_time > 0) {
			beforeTime = time;
			
			// 화면 초기화
			context.clearRect(0, 0, canvas_width * devicePixelRatio, canvas_height * devicePixelRatio);
			context.save();
			context.scale(devicePixelRatio, devicePixelRatio);
			context.translate(canvas_width / 2, canvas_height / 2);
			
			logics.forEach((logic) => {
				logic();
			});
			
			context.restore();
		}
		
		requestAnimationFrame(step);
	});
	
	// 이하 충돌 처리 함수들
	
	let checkBetween = (
		point,
		start, end
	) => {
		return (start - point) * (end - point) <= 0;
	};
	
	let checkPointInRect = (
		pointX, pointY,
		
		rectX, rectY,
		rectWidth, rectHeight,
		rectScaleX, rectScaleY,
		rectSin, rectCos
	) => {
		
		pointX -= rectX;
		pointY -= rectY;
		
		let tempX = rectX + rectCos * pointX + rectSin * pointY;
		let tempY = rectY - rectSin * pointX + rectCos * pointY;
		
		rectWidth *= rectScaleX;
		rectHeight *= rectScaleY;
		
		rectX -= rectWidth / 2;
		rectY -= rectHeight / 2;
		
		return checkBetween(tempX, rectX, rectX + rectWidth) === true && checkBetween(tempY, rectY, rectY + rectHeight) === true;
	};
	
	let checkPointInCircle = (
		pointX, pointY,
		
		circleX, circleY,
		circleWidth, circleHeight,
		circleScaleX, circleScaleY,
		circleSin, circleCos
	) => {
		
		pointX -= circleX;
		pointY -= circleY;
		
		circleWidth *= circleScaleX;
		circleHeight *= circleScaleY;
	
		let tempX = 2 * (circleCos * pointX + circleSin * pointY) / circleWidth;
		let tempY = 2 * (circleSin * pointX - circleCos * pointY) / circleHeight;
		
		return tempX * tempX + tempY * tempY <= 1;
	};
	
	let checkLineLine = (
		aX, aY,
		aStartX, aStartY,
		aEndX, aEndY,
		aScaleX, aScaleY,
		aSin, aCos,
		
		bX, bY,
		bStartX, bStartY,
		bEndX, bEndY,
		bScaleX, bScaleY,
		bSin, bCos
	) => {
		
		aStartX *= aScaleX;
		aStartY *= aScaleY;
		
		let aTempStartX = aX + aCos * aStartX + aSin * aStartY;
		let aTempStartY = aY + aSin * aStartX + aCos * aStartY;
			
		aEndX *= aScaleX;
		aEndY *= aScaleY;
		
		let aTempEndX = aX + aCos * aEndX + aSin * aEndY;
		let aTempEndY = aY + aSin * aEndX + aCos * aEndY;
		
		bStartX *= bScaleX;
		bStartY *= bScaleY;
		
		let bTempStartX = bX + bCos * bStartX + bSin * bStartY;
		let bTempStartY = bY + bSin * bStartX + bCos * bStartY;
		
		bEndX *= bScaleX;
		bEndY *= bScaleY;
		
		let bTempEndX = bX + bCos * bEndX + bSin * bEndY;
		let bTempEndY = bY + bSin * bEndX + bCos * bEndY;
		
		let denom = (aTempEndX - aTempStartX) * (bTempEndY - bTempStartY) - (bTempEndX - bTempStartX) * (aTempEndY - aTempStartY);
		
		if (denom === 0) {
			return false;
		}
		
		else {
			
			let ua = ((bTempEndY - bTempStartY) * (bTempEndX - aTempStartX) + (bTempStartX - bTempEndX) * (bTempEndY - aTempStartY)) / denom;
			let ub = ((aTempStartY - aTempEndY) * (bTempEndX - aTempStartX) + (aTempEndX - aTempStartX) * (bTempEndY - aTempStartY)) / denom;
			
			return 0 <= ua && ua <= 1 && 0 <= ub && ub <= 1;
		}
	};
	
	let checkLineCircle = (
		lineX, lineY,
		lineStartX, lineStartY,
		lineEndX, lineEndY,
		lineScaleX, lineScaleY,
		lineSin, lineCos,
		
		circleX, circleY,
		circleWidth, circleHeight,
		circleScaleX, circleScaleY,
		circleSin, circleCos
	) => {
		
		lineStartX *= lineScaleX;
		lineStartY *= lineScaleY;
		
		let lineTempStartX = lineX + lineCos * lineStartX + lineSin * lineStartY;
		let lineTempStartY = lineY + lineSin * lineStartX + lineCos * lineStartY;
		
		if (checkPointInCircle(
		lineTempStartX, lineTempStartY,
		
		circleX, circleY,
		circleWidth, circleHeight,
		circleScaleX, circleScaleY,
		circleSin, circleCos) === true) {
			return true;
		}
		
		lineEndX *= lineScaleX;
		lineEndY *= lineScaleY;
		
		let lineTempEndX = lineX + lineCos * lineEndX + lineSin * lineEndY;
		let lineTempEndY = lineY + lineSin * lineEndX + lineCos * lineEndY;
		
		if (checkPointInCircle(
		lineTempEndX, lineTempEndY,
		
		circleX, circleY,
		circleWidth, circleHeight,
		circleScaleX, circleScaleY,
		circleSin, circleCos) === true) {
			return true;
		}
		
		lineTempStartX -= circleX;
		lineTempStartY -= circleY;
		
		lineTempEndX -= circleX;
		lineTempEndY -= circleY;
		
		let tempStartX = circleCos * lineTempStartX + circleSin * lineTempStartY;
		let tempStartY = -circleSin * lineTempStartX + circleCos * lineTempStartY;
		
		let tempEndX = circleCos * lineTempEndX + circleSin * lineTempEndY;
		let tempEndY = -circleSin * lineTempEndX + circleCos * lineTempEndY;
		
		circleWidth *= circleScaleX;
		circleHeight *= circleScaleY;
		
		let m = (tempEndY - tempStartY) / (tempEndX - tempStartX);
		
		if (Math.abs(m) > 1024) {
			return checkLineCircle(0, 0, tempStartY, tempStartX, tempEndY, tempEndX, 1, 1, 0, 1, 0, 0, circleHeight, circleWidth, 1, 1, 0, 1);
		}
		
		if (checkPointInCircle(tempEndX, tempEndY, 0, 0, circleWidth, circleHeight, 1, 1, 0, 1) === true) {
			return true;
		}
		
		let s = circleWidth * circleWidth / 4;
		let t = circleHeight * circleHeight / 4;
		
		let k = tempStartY - (m * tempStartX);
		
		let a = 1 / s + m * m / t;
		let b = 2 * m * k / t;
		let c = k * k / t - 1;
		
		let discrim = b * b - 4 * a * c;
		
		if (discrim < 0) {
			return false;
		}
		
		discrim = Math.sqrt(discrim);
		a *= 2;
		
		return checkBetween((-b - discrim) / a, tempStartX, tempEndX) === true || checkBetween((-b + discrim) / a, tempStartX, tempEndX) === true;
	};
	
	let checkRectRect = (
		aX, aY,
		aWidth, aHeight,
		aScaleX, aScaleY,
		aSin, aCos,
		
		bX, bY,
		bWidth, bHeight,
		bScaleX, bScaleY,
		bSin, bCos
	) => {
		
		aWidth *= aScaleX;
		aHeight *= aScaleY;
		
		bWidth *= bScaleX;
		bHeight *= bScaleY;
		
		let aPoint1X, aPoint1Y;
		let aPoint2X, aPoint2Y;
		let aPoint3X, aPoint3Y;
		let aPoint4X, aPoint4Y;
		
		let aCW = aCos * aWidth / 2;	let aCH = aCos * aHeight / 2;
		let aSW = -aSin * aWidth / 2;	let aSH = -aSin * aHeight / 2;
		
		aPoint1X = aX - aCW - aSH;	aPoint1Y = aY + aSW - aCH;
		aPoint2X = aX + aCW - aSH;	aPoint2Y = aY - aSW - aCH;
		aPoint3X = aX + aCW + aSH;	aPoint3Y = aY - aSW + aCH;
		aPoint4X = aX - aCW + aSH;	aPoint4Y = aY + aSW + aCH;
		
		if (checkPointInRect(
		aPoint1X, aPoint1Y,
		
		bX, bY,
		bWidth, bHeight,
		1, 1,
		bSin, bCos) === true ||
			
		checkPointInRect(
		aPoint2X, aPoint2Y,
		
		bX, bY,
		bWidth, bHeight,
		1, 1,
		bSin, bCos) === true ||
			
		checkPointInRect(
		aPoint3X, aPoint3Y,
		
		bX, bY,
		bWidth, bHeight,
		1, 1,
		bSin, bCos) === true ||
			
		checkPointInRect(
		aPoint4X, aPoint4Y,
		
		bX, bY,
		bWidth, bHeight,
		1, 1,
		bSin, bCos) === true) {
			return true;
		}
		
		let bPoint1X, bPoint1Y;
		let bPoint2X, bPoint2Y;
		let bPoint3X, bPoint3Y;
		let bPoint4X, bPoint4Y;
		
		let bCW = bCos * bWidth / 2;	let bCH = bCos * bHeight / 2;
		let bSW = -bSin * bWidth / 2;	let bSH = -bSin * bHeight / 2;
		
		bPoint1X = bX - bCW - bSH;	bPoint1Y = bY + bSW - bCH;
		bPoint2X = bX + bCW - bSH;	bPoint2Y = bY - bSW - bCH;
		bPoint3X = bX + bCW + bSH;	bPoint3Y = bY - bSW + bCH;
		bPoint4X = bX - bCW + bSH;	bPoint4Y = bY + bSW + bCH;
		
		if (checkPointInRect(
		bPoint1X, bPoint1Y,
		
		aX, aY,
		aWidth, aHeight,
		1, 1,
		aSin, aCos) === true ||
			
		checkPointInRect(
		bPoint2X, bPoint2Y,
		
		aX, aY,
		aWidth, aHeight,
		1, 1,
		aSin, aCos) === true ||
			
		checkPointInRect(
		bPoint3X, bPoint3Y,
		
		aX, aY,
		aWidth, aHeight,
		1, 1,
		aSin, aCos) === true ||
			
		checkPointInRect(
		bPoint4X, bPoint4Y,
		
		aX, aY,
		aWidth, aHeight,
		1, 1,
		aSin, aCos) === true) {
			return true;
		}
		
		return checkLineLine(0, 0, aPoint1X, aPoint1Y, aPoint2X, aPoint2Y, 1, 1, 0, 1, 0, 0, bPoint1X, bPoint1Y, bPoint2X, bPoint2Y, 1, 1, 0, 1) === true ||
			checkLineLine(0, 0, aPoint1X, aPoint1Y, aPoint2X, aPoint2Y, 1, 1, 0, 1, 0, 0, bPoint2X, bPoint2Y, bPoint3X, bPoint3Y, 1, 1, 0, 1) === true ||
			checkLineLine(0, 0, aPoint1X, aPoint1Y, aPoint2X, aPoint2Y, 1, 1, 0, 1, 0, 0, bPoint3X, bPoint3Y, bPoint4X, bPoint4Y, 1, 1, 0, 1) === true ||
			checkLineLine(0, 0, aPoint1X, aPoint1Y, aPoint2X, aPoint2Y, 1, 1, 0, 1, 0, 0, bPoint4X, bPoint4Y, bPoint1X, bPoint1Y, 1, 1, 0, 1) === true ||
			
			checkLineLine(0, 0, aPoint2X, aPoint2Y, aPoint3X, aPoint3Y, 1, 1, 0, 1, 0, 0, bPoint1X, bPoint1Y, bPoint2X, bPoint2Y, 1, 1, 0, 1) === true ||
			checkLineLine(0, 0, aPoint2X, aPoint2Y, aPoint3X, aPoint3Y, 1, 1, 0, 1, 0, 0, bPoint2X, bPoint2Y, bPoint3X, bPoint3Y, 1, 1, 0, 1) === true ||
			checkLineLine(0, 0, aPoint2X, aPoint2Y, aPoint3X, aPoint3Y, 1, 1, 0, 1, 0, 0, bPoint3X, bPoint3Y, bPoint4X, bPoint4Y, 1, 1, 0, 1) === true ||
			checkLineLine(0, 0, aPoint2X, aPoint2Y, aPoint3X, aPoint3Y, 1, 1, 0, 1, 0, 0, bPoint4X, bPoint4Y, bPoint1X, bPoint1Y, 1, 1, 0, 1) === true ||
			
			checkLineLine(0, 0, aPoint3X, aPoint3Y, aPoint4X, aPoint4Y, 1, 1, 0, 1, 0, 0, bPoint1X, bPoint1Y, bPoint2X, bPoint2Y, 1, 1, 0, 1) === true ||
			checkLineLine(0, 0, aPoint3X, aPoint3Y, aPoint4X, aPoint4Y, 1, 1, 0, 1, 0, 0, bPoint2X, bPoint2Y, bPoint3X, bPoint3Y, 1, 1, 0, 1) === true ||
			checkLineLine(0, 0, aPoint3X, aPoint3Y, aPoint4X, aPoint4Y, 1, 1, 0, 1, 0, 0, bPoint3X, bPoint3Y, bPoint4X, bPoint4Y, 1, 1, 0, 1) === true ||
			checkLineLine(0, 0, aPoint3X, aPoint3Y, aPoint4X, aPoint4Y, 1, 1, 0, 1, 0, 0, bPoint4X, bPoint4Y, bPoint1X, bPoint1Y, 1, 1, 0, 1) === true ||
			
			checkLineLine(0, 0, aPoint4X, aPoint4Y, aPoint1X, aPoint1Y, 1, 1, 0, 1, 0, 0, bPoint1X, bPoint1Y, bPoint2X, bPoint2Y, 1, 1, 0, 1) === true ||
			checkLineLine(0, 0, aPoint4X, aPoint4Y, aPoint1X, aPoint1Y, 1, 1, 0, 1, 0, 0, bPoint2X, bPoint2Y, bPoint3X, bPoint3Y, 1, 1, 0, 1) === true ||
			checkLineLine(0, 0, aPoint4X, aPoint4Y, aPoint1X, aPoint1Y, 1, 1, 0, 1, 0, 0, bPoint3X, bPoint3Y, bPoint4X, bPoint4Y, 1, 1, 0, 1) === true ||
			checkLineLine(0, 0, aPoint4X, aPoint4Y, aPoint1X, aPoint1Y, 1, 1, 0, 1, 0, 0, bPoint4X, bPoint4Y, bPoint1X, bPoint1Y, 1, 1, 0, 1) === true;
	};
	
	let checkRectCircle = (
		rectX, rectY,
		rectWidth, rectHeight,
		rectScaleX, rectScaleY,
		rectSin, rectCos,
		
		circleX, circleY,
		circleWidth, circleHeight,
		circleScaleX, circleScaleY,
		circleSin, circleCos) => {
		
		if (checkPointInRect(
		circleX, circleY,
		
		rectX, rectY,
		rectWidth, rectHeight,
		rectScaleX, rectScaleY,
		rectSin, rectCos) === true) {
			return true;
		}
		
		let rectPoint1X, rectPoint1Y;
		let rectPoint2X, rectPoint2Y;
		let rectPoint3X, rectPoint3Y;
		let rectPoint4X, rectPoint4Y;
		
		rectWidth *= rectScaleX / 2;
		rectHeight *= rectScaleY / 2;
		
		let cw = rectCos * rectWidth;	let ch = rectCos * rectHeight;
		let sw = -rectSin * rectWidth;	let sh = -rectSin * rectHeight;
		
		rectPoint1X = rectX - cw - sh;	rectPoint1Y = rectY + sw - ch;
		rectPoint2X = rectX + cw - sh;	rectPoint2Y = rectY - sw - ch;
		rectPoint3X = rectX + cw + sh;	rectPoint3Y = rectY - sw + ch;
		rectPoint4X = rectX - cw + sh;	rectPoint4Y = rectY + sw + ch;
		
		if (checkPointInCircle(
		rectPoint1X, rectPoint1Y,
		
		circleX, circleY,
		circleWidth, circleHeight,
		circleScaleX, circleScaleY,
		circleSin, circleCos) === true ||
			
		checkPointInCircle(
		rectPoint2X, rectPoint2Y,
		
		circleX, circleY,
		circleWidth, circleHeight,
		circleScaleX, circleScaleY,
		circleSin, circleCos) === true ||
			
		checkPointInCircle(
		rectPoint3X, rectPoint3Y,
		
		circleX, circleY,
		circleWidth, circleHeight,
		circleScaleX, circleScaleY,
		circleSin, circleCos) === true ||
			
		checkPointInCircle(
		rectPoint4X, rectPoint4Y,
		
		circleX, circleY,
		circleWidth, circleHeight,
		circleScaleX, circleScaleY,
		circleSin, circleCos) === true) {
			return true;
		}
		
		circleWidth *= circleScaleX;
		circleHeight *= circleScaleY;
		
		return checkLineCircle(0, 0, rectPoint1X, rectPoint1Y, rectPoint2X, rectPoint2Y, 1, 1, 0, 1, circleX, circleY, circleWidth, circleHeight, 1, 1, circleSin, circleCos) === true ||
			checkLineCircle(0, 0, rectPoint2X, rectPoint2Y, rectPoint3X, rectPoint3Y, 1, 1, 0, 1, circleX, circleY, circleWidth, circleHeight, 1, 1, circleSin, circleCos) === true ||
			checkLineCircle(0, 0, rectPoint3X, rectPoint3Y, rectPoint4X, rectPoint4Y, 1, 1, 0, 1, circleX, circleY, circleWidth, circleHeight, 1, 1, circleSin, circleCos) === true ||
			checkLineCircle(0, 0, rectPoint4X, rectPoint4Y, rectPoint1X, rectPoint1Y, 1, 1, 0, 1, circleX, circleY, circleWidth, circleHeight, 1, 1, circleSin, circleCos) === true;
	};
	
	let realRoot = (z4, z3, z2, z1, z0) => {
		
		if (z0 === 0) {
			return true;
		}
		if (z4 === 0) {
			if (z3 !== 0) {
				return true;
			}
			if (z2 !== 0) {
				return (z1 * z1 - 4 * z2 * z0) >= 0;
			}
			return z1 !== 0;
		}
		
		let a = z3 / z4;
		let b = z2 / z4;
		let c = z1 / z4;
		let d = z0 / z4;
		let p = (8 * b - 3 * a * a) / 8;
		let q = (a * a * a - 4 * a * b + 8 * c) / 8;
		let r = (-3 * a * a * a * a + 256 * d - 64 * c * a + 16 * a * a * b) / 256;
		
		let descrim = 256 * r * r * r - 128 * p * p * r * r + 144 * p * q * q * r - 27 * q * q * q * q + 16 * p * p * p * p * r - 4 * p * p * p * q * q;
		let P = 8 * p;
		let D = 64 * r - 16 * p * p;
		
		return descrim < 0 || (descrim > 0 && P < 0 && D < 0) || (descrim === 0 && (D !== 0 || P <= 0));
	};
	
	let yIntersect = (aa, ab, ac, ad, ae, af, ba, bb, bc, bd, be, bf) => {
		
		let deltaB = (bb /= ba) - (ab /= aa);
		let deltaC = (bc /= ba) - (ac /= aa);
		let deltaD = (bd /= ba) - (ad /= aa);
		let deltaE = (be /= ba) - (ae /= aa);
		let deltaF = (bf /= ba) - (af /= aa);
		
		if (deltaB === 0 && deltaD === 0) {
			return realRoot(0, 0, deltaC, deltaE, deltaF);
		}
		
		let a3 = ab * bc - bb * ac;
		let a2 = ab * be + ad * bc - bb * ae - bd * ac;
		let a1 = ab * bf + ad * be - bb * af - bd * ae;
		let a0 = ad * bf - bd * af;
		
		let A = deltaC * deltaC - a3 * deltaB;
		let B = 2 * deltaC * deltaE - deltaB * a2 - deltaD * a3;
		let C = deltaE * deltaE + 2 * deltaC * deltaF - deltaB * a1 - deltaD * a2;
		let D = 2 * deltaE * deltaF - deltaD * a1 - deltaB * a0;
		let E = deltaF * deltaF - deltaD * a0;
		
		return realRoot(A, B, C, D, E);
	};
	
	let checkCircleCircle = (
		aX, aY,
		aWidth, aHeight,
		aScaleX, aScaleY,
		aSin, aCos,
		
		bX, bY,
		bWidth, bHeight,
		bScaleX, bScaleY,
		bSin, bCos
	) => {
		
		aWidth *= aScaleX;
		aHeight *= aScaleY;
		
		bWidth *= bScaleX;
		bHeight *= bScaleY;
		
		bX -= aX;
		bY -= aY;
		aX = aY = 0;
		
		let maxR = ((aWidth > aHeight ? aWidth : aHeight) + (bWidth > bHeight ? bWidth : bHeight)) / 2;
		
		if (bX * bX + bY * bY > maxR * maxR) {
			return false;
		}
		
		if (
		checkPointInCircle(bX, bY, aX, aY, aWidth, aHeight, 1, 1, aSin, aCos) === true ||
		checkPointInCircle(aX, aY, bX, bY, bWidth, bHeight, 1, 1, bSin, bCos) === true) {
			return true;
		}
		
		// create bivariate forms
		
		let a = aCos * aX + aSin * aY;
		let c = -aSin * aX + aCos * aY;
		
		aSin = -aSin;
		
		let b = aWidth * aWidth / 4;
		let d = aHeight * aHeight / 4;
		
		let aa = (aCos * aCos / b) + (aSin * aSin / d);
		let ab = (-2 * aCos * aSin / b) + (2 * aCos * aSin / d);
		let ac = (aSin * aSin / b) + (aCos * aCos / d);
		let ad = (-2 * a * aCos / b) - (2 * c * aSin / d);
		let ae = (2 * a * aSin / b) - (2 * c * aCos / d);
		let af = (a * a / b) + (c * c / d) - 1;
		
		a = bCos * bX + bSin * bY;
		c = -bSin * bX + bCos * bY;
		
		bSin = -bSin;
		
		b = bWidth * bWidth / 4;
		d = bHeight * bHeight / 4;
		
		let ba = (bCos * bCos / b) + (bSin * bSin / d);
		let bb = (-2 * bCos * bSin / b) + (2 * bCos * bSin / d);
		let bc = (bSin * bSin / b) + (bCos * bCos / d);
		let bd = (-2 * a * bCos / b) - (2 * c * bSin / d);
		let be = (2 * a * bSin / b) - (2 * c * bCos / d);
		let bf = (a * a / b) + (c * c / d) - 1;
		
		return yIntersect(aa, ab, ac, ad, ae, af, ba, bb, bc, bd, be, bf) && yIntersect(ac, ab, aa, ae, ad, af, bc, bb, ba, be, bd, bf);
	};
})();