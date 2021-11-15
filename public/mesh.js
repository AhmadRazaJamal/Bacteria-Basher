function Mesh(gl, geometry) {
    var vertexCount = geometry.vertexCount()
    this.positions = new VBO(gl, geometry.positions(), vertexCount)
    this.normals = new VBO(gl, geometry.normals(), vertexCount)
    this.vertexCount = vertexCount
    this.position = new Transformation()
    this.gl = gl
}

Mesh.prototype.destroy = function() {
    this.positions.destroy()
    this.normals.destroy()
}

Mesh.prototype.draw = function(shaderProgram) {
    this.positions.bindToAttribute(shaderProgram.position)
    this.normals.bindToAttribute(shaderProgram.normal)
    this.position.sendToGpu(this.gl, shaderProgram.model)
    this.gl.drawArrays(this.gl.TRIANGLES, 0, this.vertexCount)
}

Mesh.prototype.drawBacteria = function(shaderProgram) {
    var scale = this.position.scale(0.1, 0.1, 0.1);
    var transform = this.position.translate(40, 30, 1);

    scale.mult(transform).sendToGpu(this.gl, shaderProgram.view);

    this.positions.bindToAttribute(shaderProgram.position)
    this.normals.bindToAttribute(shaderProgram.normal)
    this.position.sendToGpu(this.gl, shaderProgram.model)
    this.gl.drawArrays(this.gl.TRIANGLES, 0, this.vertexCount)
}


Mesh.load = function(gl, modelUrl) {
    var geometry = Geometry.loadOBJ(modelUrl)
    return Promise.all([geometry]).then(function(params) {
        return new Mesh(gl, params[0], params[1])
    })
}