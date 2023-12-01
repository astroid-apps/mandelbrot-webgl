/*
	WebGLによるマンデルブロ集合描画
	viewで与えられた四隅の範囲に基づいて描画したcanvasを返す
	
	2020/12/04 新規作成
*/

//view: 四隅のXY座標
const mandelbrot = function(width,height,view){
	
	const cv = document.createElement("canvas");
	cv.width = width;
	cv.height = height;
	
	const gl = cv.getContext("webgl");

	const vsSrc = `
		attribute vec2 vij;
		attribute vec2 vxy;

		//フラグメントシェーダーに渡す頂点のXY座標(フラグメントシェーダーでは各ピクセル位置の座標に内挿された値が与えられる)
		varying vec2 xy;

		void main(){
			xy = vxy;
			gl_Position = vec4(vij, 0.0, 1.0);
		}
	`;

	const fsSrc = `
//		precision mediump float;
		precision highp float;

		//バーテックスシェーダーから渡される値(各ピクセル位置のXY座標)
		varying vec2 xy;

		int md(float x,float y){
			vec2 z = vec2(0.0, 0.0);

			for(int i=0;i<500;i++){
				z = vec2(z.x * z.x - z.y * z.y + x, z.x * z.y * 2.0 + y);

				if(length(z) > 10.0) return i;
			}

			return 0;
		}

		void main(){
			float n = float(md(xy.x,xy.y));
			gl_FragColor = vec4(sin(n / 20.0), sin(n / 20.0), sin(n / 10.0), 1.0);
		}
	`;

	//頂点シェーダー
	const vs = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(vs, vsSrc);
	gl.compileShader(vs);

	//フラグメントシェーダー
	const fs = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(fs, fsSrc);
	gl.compileShader(fs);

	//WebGLProgramオブジェクトを作成
	const program = gl.createProgram();
	gl.attachShader(program, vs);
	gl.attachShader(program, fs);
	gl.linkProgram(program);
	gl.useProgram(program);

	//頂点データ(canvas全体を覆うWebGLの座標)
	const vij = gl.getAttribLocation(program, "vij");
	gl.enableVertexAttribArray(vij);
	gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
		-1.0, -1.0, //左下
		-1.0, 1.0, //左上
		1.0, -1.0, //右下
		1.0, 1.0 //右上
	]), gl.STATIC_DRAW);
	gl.vertexAttribPointer(vij, 2, gl.FLOAT, false, 0, 0);

	//各頂点に対応させるXY座標
	const vxy = gl.getAttribLocation(program, "vxy");
	gl.enableVertexAttribArray(vxy);
	gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
		view.bl.x, view.bl.y, //左下
		view.tl.x, view.tl.y, //左上
		view.br.x, view.br.y, //右下
		view.tr.x, view.tr.y //右上
	]), gl.STATIC_DRAW);
	gl.vertexAttribPointer(vxy, 2, gl.FLOAT, false, 0, 0);

	//描画
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
	
	return cv;
};

export {mandelbrot};