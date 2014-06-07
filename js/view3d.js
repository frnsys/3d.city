
//------------------------------------------------------//
//                 THREE JS & SEA3D                     //
//------------------------------------------------------//

var V3D = { REVISION: '0.1a' };

V3D.Base = function(){
	this.ToRad = Math.PI / 180;
	this.canvas = document.getElementById("threeCanvas");
    this.camera = null; 
    this.scene = null; 
    this.renderer = null;

    this.cam = { horizontal:90, vertical:65, distance:120 };
    this.vsize = { x:window.innerWidth, y:window.innerHeight, z:window.innerWidth/window.innerHeight};
    this.mouse = { ox:0, oy:0, h:0, v:0, mx:0, my:0, dx:0, dy:0, down:false, over:false, moving:true };

    this.select = '';
    this.meshs = {};

    this.trees = [];

    this.terrain = null;
    this.tool = null;

    this.notAuto = true;

    this.toolSet = [
		{id:0,  tool:'residential', size:3, price:100,   color:'lime'},
		{id:1,  tool:'commercial',  size:3, price:100,   color:'blue'},
		{id:2,  tool:'industrial',  size:3, price:100,   color:'yellow'},
		{id:3,  tool:'police',      size:3, price:500,   color:'darkblue'},
		{id:4,  tool:'fire',        size:3, price:500,   color:'red'},
		{id:5,  tool:'port',        size:4, price:3000,  color:'dodgerblue'},
		{id:6,  tool:'airport',     size:6, price:10000, color:'violet'},
		{id:7,  tool:'stadium',     size:4, price:5000,  color:'indigo'},
		{id:8,  tool:'coal',        size:4, price:3000,  color:'gray'},
		{id:9,  tool:'nuclear',     size:4, price:5000,  color:'mistyrose'},
		{id:10, tool:'road',        size:1, price:10,    color:'black'},
		{id:11, tool:'rail',        size:1, price:20,    color:'brown'},
		{id:12, tool:'wire',        size:1, price:5 ,    color:'khaki'},
		{id:13, tool:'park',        size:1, price:10,    color:'darkgreen'},
		{id:14, tool:'query',       size:1, price:0,     color:'cyan'},
		{id:15, tool:'bulldozer',   size:1, price:1,     color:'salmon'},
		{id:16, tool:'none',   size:0, price:0,     color:'green'}
	];

    this.loadSea3d();

}

V3D.Base.prototype = {
    constructor: V3D.Base,
    init:function() {

    	this.renderer = new THREE.WebGLRenderer({ canvas:this.canvas, antialias:false });
    	this.renderer.setSize( this.vsize.x, this.vsize.y, true );
    	this.renderer.autoClear = false;

    	this.scene = new THREE.Scene();
    	this.camera = new THREE.PerspectiveCamera( 50, this.vsize.z, 0.1, 1000 );
    	this.scene.add( this.camera );

    	this.rayVector = new THREE.Vector3( 0, 0, 1 );
    	this.projector = new THREE.Projector();
    	this.raycaster = new THREE.Raycaster();
        
        this.land = new THREE.Object3D();
        this.scene.add( this.land );

        this.center = new THREE.Vector3();
        this.moveCamera();

        

        var sky = this.gradTexture([[0.5,0.45, 0.2], ['#6666e6','lightskyblue', 'deepskyblue']]);
        this.back = new THREE.Mesh( new THREE.IcosahedronGeometry(300,1), new THREE.MeshBasicMaterial( { map:sky, side:THREE.BackSide, depthWrite: false }  ));
        this.scene.add( this.back );

        var _this = this;

        window.addEventListener( 'resize', function(e) { _this.resize() }, false );

	    this.canvas.addEventListener( 'mousemove',  function(e) {_this.onMouseMove(e)} , false );
	    this.canvas.addEventListener( 'mousedown',  function(e) {_this.onMouseDown(e)}, false );
	    this.canvas.addEventListener( 'mouseup',  function(e) {_this.onMouseUp(e)}, false );
	    this.canvas.addEventListener( 'mouseout',  function(e) {_this.onMouseUp(e)}, false );
	    
	    this.canvas.addEventListener( 'touchstart',  function(e) {_this.onMouseDown(e)}, false );
	    this.canvas.addEventListener( 'touchend',  function(e) {_this.onMouseUp(e)}, false );
	    this.canvas.addEventListener( 'touchmove',  function(e) {_this.onMouseMove(e)}, false );
	    var body = document.body;
	    if( body.addEventListener ){
	        body.addEventListener( 'mousewheel',  function(e) {_this.onMouseWheel(e)}, false ); //chrome
	        body.addEventListener( 'DOMMouseScroll',  function(e) {_this.onMouseWheel(e)}, false ); // firefox
	    }else if( body.attachEvent ){
	        body.attachEvent("onmousewheel" ,  function(e) {_this.onMouseWheel(e)}); // ie
	    }
	    //this.render();
	    start();
    },
    loadSea3d : function (){
    	_this = this;
	    var s = 1;
	    var loader = new THREE.SEA3D( true );
	    loader.onComplete = function( e ) {
	        var m, map;
	        var i = loader.meshes.length;
	        while(i--){
	            m = loader.meshes[i];
	            if(m.material.map){
		            map = m.material.map;
		            m.material = new THREE.MeshBasicMaterial({ map:map });
		        } else {
		        	m.material = new THREE.MeshBasicMaterial({ color:0xffffff });
		        }
	            m.scale.set(s,s,-s);
	            //_this.getFaces(m);
	            _this.meshs[m.name] = m;
	            
	            //scene.add(m);
	        }
	        _this.init();
	    }
	    //loader.parser = THREE.SEA3D.DEFAULT;
	    loader.load( 'img/world.sea' );
	},
    addTree : function(x,y,v){
    	var b;
    	if(this.meshs['tree'+v]) b = this.meshs['tree'+v].clone();
    	else b = this.meshs['tree21'].clone();
        b.position.set(x,0,y);
        this.scene.add( b );
        this.trees.push(b);
    },
    clearTree : function(){
    	if ( this.trees.length > 0 ) {
    		var i = this.trees.length;
    		while(i--){
    			this.scene.remove( this.trees[i] );
    		}
    		this.trees = [];
    	}
    },
    render:function(){
    	if(!this.notAuto) return;
    	this.renderer.clear();
    	this.renderer.render( this.scene, this.camera );
    	//log(this.select);
    },
    resize: function(){
    	this.vsize = { x:window.innerWidth, y:window.innerHeight, z:window.innerWidth/window.innerHeight};
	    this.camera.aspect = this.vsize.z;
	    this.camera.updateProjectionMatrix();
	    this.renderer.setSize(this.vsize.x,this.vsize.y, true);
	    this.render();
	},
	updateTerrain : function(canvas, size, island){	
		this.center.x = size[0]*0.5;
		this.center.z = size[1]*0.5;
		this.moveCamera();
		this.back.position.copy(this.center);
		
		if(island>0) this.back.material.map = this.gradTexture([[0.51,0.49, 0.3], ['#6666e6','lightskyblue', 'deepskyblue']]);//this.back.material.color.setHex(0x6666e6);
		else this.back.material.map = this.gradTexture([[0.51,0.49, 0.3], ['#cc7f66','lightskyblue', 'deepskyblue']]);//this.back.material.color.setHex(0xcc7f66);

        if(this.terrain === null){
			//this.terrain = this.meshs['plane'].clone();
			this.terrain = new THREE.Mesh( new THREE.PlaneGeometry( 1, 1, 1, 1 ),  new THREE.MeshBasicMaterial({map:new THREE.Texture(canvas)}) );
			this.terrain.material.map.needsUpdate = true;
            this.terrain.geometry.applyMatrix(new THREE.Matrix4().makeRotationX(-90*this.ToRad));
			this.land.add( this.terrain );
		} else {
			this.terrain.material.map = new THREE.Texture(canvas);
	        this.terrain.material.map.needsUpdate = true;
		}
		this.terrain.scale.set(size[0], 1, size[1]);
		this.terrain.position.set((size[0]*0.5)-0.5, 0, (size[1]*0.5)-0.5);
	    this.render();
	},
	rayTest : function () {
		this.projector.unprojectVector( this.rayVector, this.camera );
		this.raycaster.set( this.camera.position, this.rayVector.sub( this.camera.position ).normalize() );

		if ( this.land.children.length > 0 ) {
			var intersects = this.raycaster.intersectObjects( this.land.children );
			if ( intersects.length > 0 ) {
				//logLand(intersects[0].object.name);
				//this.select = intersects[0].object.name;
				if(this.tool!==null) this.tool.position.set(Math.round(intersects[0].point.x), 0, Math.round(intersects[0].point.z));
				//log(intersects[0].point.x, intersects[0].point.z)
				/*marker.position.set( 0, 0, 0 );
				if(intersects[0].face)marker.lookAt(intersects[0].face.normal);
				marker.position.copy( intersects[0].point );*/
				
				//if(sh)shoot();
		    } else {
		    	//this.select = '';
		    }
		}
		
		//log(this.select);
	},
	addTool : function(id){
		//if(!id) id = Math.floor(Math.random()*16);

		if(this.tool !== null) this.removeTool();
		
		var ntool = this.toolSet[id];
		var size = ntool.size;
		var name = ntool.tool;
		if(id!==16){
			this.tool = new THREE.Mesh(new THREE.BoxGeometry(size,1,size), new THREE.MeshBasicMaterial({color:ntool.color}) )
			if(size == 6 || size == 4) this.tool.geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0.5, 0, 0.5));
	        this.scene.add(this.tool);
        }
        sendTool(name);
	},
	removeTool : function(){
		this.scene.remove(this.tool);
		this.tool = null;
	},
	Orbit : function (origine, horizontal, vertical, distance) {
	    var p = new THREE.Vector3();
	    if(vertical>87)vertical=87;
	    if(vertical<1)vertical=1;
	    var phi = vertical*this.ToRad ;
	    var theta = horizontal*this.ToRad;
	    p.x = (distance * Math.sin(phi) * Math.cos(theta)) + origine.x;
	    p.z = (distance * Math.sin(phi) * Math.sin(theta)) + origine.z;
	    p.y = (distance * Math.cos(phi)) + origine.y;
	    return p;
	},
	moveCamera : function () {
	    this.camera.position.copy(this.Orbit(this.center, this.cam.horizontal, this.cam.vertical, this.cam.distance));
	    this.camera.lookAt(this.center);
	    //this.render();
	},
	onMouseDown : function (e) {
	    e.preventDefault();
	    var px, py;
	    if(e.touches){
	        px = e.clientX || e.touches[ 0 ].pageX;
	        py = e.clientY || e.touches[ 0 ].pageY;
	    } else {
	        px = e.clientX;
	        py = e.clientY;
	    }
	    this.mouse.ox = px;
	    this.mouse.oy = py;
	    this.rayVector.x = ( px / this.vsize.x ) * 2 - 1;
	    this.rayVector.y = - ( py / this.vsize.y ) * 2 + 1;
	    this.mouse.h = this.cam.horizontal;
	    this.mouse.v = this.cam.vertical;
	    this.mouse.down = true;
	    
	    //this.rayTest();
	    this.render();
	},
	onMouseUp : function (e) {
	    this.mouse.down = false;
	    document.body.style.cursor = 'auto';
	},
	onMouseMove : function (e) {
	    e.preventDefault();
	    var px, py;
	    if(e.touches){
	        px = e.clientX || e.touches[ 0 ].pageX;
	        py = e.clientY || e.touches[ 0 ].pageY;
	    } else {
	        px = e.clientX;
	        py = e.clientY;
	    }
	    
	    if (this.mouse.down) {      
	        document.body.style.cursor = 'move';
	        this.cam.horizontal = ((px - this.mouse.ox) * 0.3) + this.mouse.h;
	        this.cam.vertical = (-(py -this. mouse.oy) * 0.3) + this.mouse.v;
	        this.moveCamera();
	    } else {
			this.rayVector.x = ( px / this.vsize.x ) * 2 - 1;
		    this.rayVector.y = - ( py / this.vsize.y ) * 2 + 1;
			this.rayTest();
		}
	    //if(!self.focus())self.focus();
	    this.render(); 
	},
	onMouseWheel : function (e) {
	    e.preventDefault();
	    var delta = 0;
	    if(e.wheelDelta){delta=e.wheelDelta*-1;}
	    else if(e.detail){delta=e.detail*20;}
	    this.cam.distance+=(delta/80);
	    if(this.cam.distance<2)this.cam.distance = 2;
	    if(this.cam.distance>150)this.cam.distance = 150;
	    this.moveCamera();
	    this.render(); 
	},
	gradTexture : function(color) {
	    var c = document.createElement("canvas");
	    var ct = c.getContext("2d");
	    c.width = 16; c.height = 256;
	    var gradient = ct.createLinearGradient(0,0,0,256);
	    var i = color[0].length;
	    while(i--){ gradient.addColorStop(color[0][i],color[1][i]); }
	    ct.fillStyle = gradient;
	    ct.fillRect(0,0,16,256);
	    var texture = new THREE.Texture(c);
	    texture.needsUpdate = true;
	    return texture;
	},
	paintMap : function(src, ar, mapSize, island) {
		this.clearTree();
		var c = document.createElement('canvas');
		var ctx = c.getContext("2d");
		c.width = mapSize[0]*16;
		c.height = mapSize[1]*16;
		var y = mapSize[1];
		var x, v, px, py, n = ar.length;
		while(y--){
			x = mapSize[0];
			while(x--){
				n--;
				v = ar[n];
				if(v > 20 && v < 44){ this.addTree(x, y, v); v=0 };
				px = v % 32 * 16;
                py = Math.floor(v / 32) * 16;
				ctx.drawImage(src,px, py, 16, 16, x*16, y*16, 16, 16);
			}
		}
		this.updateTerrain(c, mapSize, island);
	}
}