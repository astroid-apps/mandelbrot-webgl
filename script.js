/*
	mandelbrot
	2020/10/26 新規作成
*/

import {Viewer} from "./Viewer.js";
import {mandelbrot} from "./mandelbrot.js";

const vw = new Viewer(document.getElementById("viewer"),{
	x: {
		init: -0.5,
		min: -2,
		max: 1,
	},
	y: {
		init: 0.0,
		min: -1.5,
		max: 1.5,
	},
	scale: {
		init: 100,
		min: 100,
		max: 200000000,
	},
},function(ctx,width,height,getXY){
	
	const view = {
		tl: getXY(0,0),
		tr: getXY(width,0),
		br: getXY(width,height),
		bl: getXY(0,height),
	};
	
	ctx.save();
	ctx.resetTransform();
	ctx.drawImage(mandelbrot(width,height,view),0,0);
	ctx.restore();
	
},function(str){
	
	document.getElementById("status").innerHTML = str;
	
});
