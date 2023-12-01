/*
	画面中心の「＋」表示(IJ座標系で処理)
	2020/11/15 Map.jsから切り離し
*/

const drawCenter = function(ctx,size,width,height){
	ctx.save();
	ctx.resetTransform();

	const ci = width * 0.5;
	const cj = height * 0.5;

	ctx.lineWidth = 1.0;
	
	ctx.beginPath();
	ctx.moveTo(ci-size,cj);
	ctx.lineTo(ci+size,cj);
	ctx.moveTo(ci,cj-size);
	ctx.lineTo(ci,cj+size);
	ctx.closePath();
	ctx.stroke();

	ctx.restore();
};

export {drawCenter};