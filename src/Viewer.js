/*
	Viewer
	2020/10/26 新規作成
*/

import * as pt from "./pinchTransform.js";
import {drawCenter} from "./drawCenter.js";
import {PointerController} from "./PointerController.js";

//表示画面
const Viewer = function(element,view,draw,status){
	
	if(!("min" in view.x)) view.x.min = undefined;
	if(!("max" in view.x)) view.x.max = undefined;
	if(!("min" in view.y)) view.y.min = undefined;
	if(!("max" in view.y)) view.y.max = undefined;
	
	const width = element.clientWidth;
	const height = element.clientHeight;
	
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	canvas.style.cursor = "move";
	canvas.style.touchAction = "none";
	element.appendChild(canvas);
	
	const ctx = canvas.getContext("2d");
	ctx.fillStyle = "rgba(255,255,255,1.0)";
	ctx.strokeStyle = "rgba(255,255,255,1.0)";
	
	//拡大表示時のスムージング無効化
//	ctx.imageSmoothingEnabled = false;
//	ctx.mozImageSmoothingEnabled = false;
//	ctx.webkitImageSmoothingEnabled = false;
//	ctx.msImageSmoothingEnabled = false;
	
	//原点をcanvas中心に移動
	ctx.translate(width * 0.5, height * 0.5);
	
	//縮尺[px/1]、Y軸を上下逆転
	ctx.scale(view.scale.init, -view.scale.init);
	
	//画面中心の座標(X,Y)を設定
	ctx.translate(-view.x.init, -view.y.init);
	
	//--------------------------------------------------
	//座標変換
	//--------------------------------------------------
	
	let mtXY2IJ = ctx.getTransform();
	let mtIJ2XY = ctx.getTransform().invertSelf();
	
	//getXY,getIJ,getScaleを呼び出す前に実行する必要あり
	const updateMatrix = function(){
		mtXY2IJ = ctx.getTransform();
		mtIJ2XY = ctx.getTransform().invertSelf();
	};
	
	const getXY = function(i,j){
		const x = mtIJ2XY.a * i + mtIJ2XY.c * j + mtIJ2XY.e;
		const y = mtIJ2XY.b * i + mtIJ2XY.d * j + mtIJ2XY.f;
		return {x,y};
	};
	
	const getIJ = function(x,y){
		const i = mtXY2IJ.a * x + mtXY2IJ.c * y + mtXY2IJ.e;
		const j = mtXY2IJ.b * x + mtXY2IJ.d * y + mtXY2IJ.f;
		return {i,j};
	};
	
	const getScale = function(){
		return Math.sqrt(mtXY2IJ.a * mtXY2IJ.a + mtXY2IJ.b * mtXY2IJ.b);
	};
	
	//--------------------------------------------------
	//移動拡大制約
	//--------------------------------------------------
	
	//画面中心がxyの範囲内に収まるように移動
	const clampXY = function(){
		updateMatrix();
		const p = getXY(width * 0.5,height * 0.5);
		
		let x = p.x;
		let y = p.y;
		
		if(view.x.min != undefined && x < view.x.min) x = view.x.min;
		if(view.x.max != undefined && x > view.x.max) x = view.x.max;
		if(view.y.min != undefined && y < view.y.min) y = view.y.min;
		if(view.y.max != undefined && y > view.y.max) y = view.y.max;
		
		ctx.translate(p.x - x, p.y - y);
	};
	
	//p: 拡大中心位置(XY座標)
	const clampScale = function(p){
		updateMatrix();
		const scale = getScale();
		
		let k = 1;
		
		if(scale > view.scale.max) k = view.scale.max / scale;
		if(scale < view.scale.min) k = view.scale.min / scale;
		
		ctx.translate(p.x, p.y);
		ctx.scale(k,k);
		ctx.translate(-p.x, -p.y);
	};
	
	//--------------------------------------------------
	//ポインターイベント
	//--------------------------------------------------
	
	const pc = new PointerController(canvas,function(pointers){
		
		if(pointers.length == 1){
			movingUpdate(pointers[0]);
			
		}else if(pointers.length == 2){
			movingUpdate(pointers[0],pointers[1]);
		}
		
	},function(pointers){
		
		//座標変換を確定させる
		if(pointers.length == 1){
			pt.XY(ctx,pointers[0]);
			
		}else if(pointers.length == 2){
			pt.XY(ctx,pointers[0],pointers[1]);
			
			//ズーム制約
			const ci = (pointers[0].si + pointers[1].si) * 0.5;
			const cj = (pointers[0].sj + pointers[1].sj) * 0.5;
			updateMatrix();
			clampScale(getXY(ci,cj));
		}
		
		clampXY();
		update();
	});
	
	//--------------------------------------------------
	//マウスホイールイベント(PC専用)
	//--------------------------------------------------
	
	canvas.addEventListener("wheel",function(e){
		
		//マウスの位置pを中心にk倍する
		updateMatrix();
		const p = getXY(e.offsetX,e.offsetY);
		const k = e.deltaY < 0 ? 1.4 : 1 / 1.4;
		
		ctx.translate(p.x,p.y);
		ctx.scale(k,k);
		ctx.translate(-p.x,-p.y);
		
		clampScale(p);
		clampXY();
		update();
	});
	
	
	//--------------------------------------------------
	//status表示(現在のctxにおける画面中心のXY座標とScale)
	//--------------------------------------------------
	
	const info = function(){
		const i = width * 0.5;
		const j = height * 0.5;
		const m = ctx.getTransform().invertSelf();
		const x = m.a * i + m.c * j + m.e;
		const y = m.b * i + m.d * j + m.f;
		const s = 1 / Math.sqrt(m.a * m.a + m.b * m.b);
		status("X=" + x.toFixed(8) + "<br>Y=" + y.toFixed(8) + "<br>Scale=" + s.toFixed(1) + "[px/1]");
	};
	
	//--------------------------------------------------
	//描画
	//--------------------------------------------------
	
	//画面に表示された画像(移動中に表示させる)
	const canvas2 = document.createElement("canvas");
	canvas2.width = width;
	canvas2.height = height;
	const ctx2 = canvas2.getContext("2d");
	
	//移動しながらの簡易表示
	const movingUpdate = function(p0,p1){
		
		//IJ座標系で処理
		ctx.save();
		ctx.resetTransform();
		ctx.clearRect(0, 0, width, height);
		
		pt.IJ(ctx,p0,p1);
		
		ctx.drawImage(canvas2,0,0,width,height,0,0,width,height);
		ctx.restore();
		
		drawCenter(ctx,10,width,height);
		
		//XY座標系で画面中心位置の状態を求めて表示
		ctx.save();
		pt.XY(ctx,p0,p1);
		info();
		ctx.restore();
	};
	
	//移動完了後の再表示
	const update = function(){
		//IJ座標系に直して全画面消去
		ctx.save();
		ctx.resetTransform();
		ctx.clearRect(0, 0, width, height);
		ctx.restore();
		
		//XY座標で描画
		draw(ctx,width,height,getXY);
		
		//移動中表示用の画像保存
		ctx2.clearRect(0, 0, width, height);
		ctx2.drawImage(canvas,0,0);

		//情報表示
		drawCenter(ctx,10,width,height);
		info();
	};
	
	update();
};

export {Viewer};