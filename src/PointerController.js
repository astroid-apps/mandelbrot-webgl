/*
	PointerController
	2020/11/23 Canvasから切り離し
*/

const PointerController = function(canvas,move,end){
	
	//クリックまたはタップされたポインターの位置
	let pointers = [];
	
	canvas.addEventListener("pointerdown",function(e){
		pointers.push({
			id: e.pointerId,
			si: e.offsetX,
			sj: e.offsetY,
			ei: e.offsetX,
			ej: e.offsetY,
		});
	});
	
	//該当するポインターの状態を更新する
	const update = function(e){
		if(pointers.length == 0) return;
		const pt = pointers.find(function(p){
			return p.id == e.pointerId;
		});
		
		//最新位置
		pt.ei = e.offsetX;
		pt.ej = e.offsetY;
		
		//移動量
		pt.di = e.offsetX - pt.si;
		pt.dj = e.offsetY - pt.sj;
	};
	
	canvas.addEventListener("pointermove",function(e){
		move(pointers);
		update(e);
	});
	
	//ポインター終了時の動作
	const pointerend = function(e){
		end(pointers);
		pointers = [];
	};
	
	window.addEventListener("pointerup",pointerend);
	window.addEventListener("pointercancel",pointerend);
	
	
	//pointermoveイベント毎に描画する場合は必須
	this.reset = function(){
		pointers.forEach(function(p){
			p.si = p.ei;
			p.sj = p.ej;
			p.di = 0;
			p.dj = 0;
		});
	};
};

export {PointerController};