function Renderer(canvas) {
    var gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    gl.enable(gl.DEPTH_TEST)
    this.gl = gl
    this.shader = null
}

Renderer.prototype.getContext = function() {
    return this.gl
}

Renderer.prototype.setShader = function(shader) {
    this.shader = shader
}

Renderer.prototype.render = function(camera, light, objects, gl) {
    var shader = this.shader
    if (!shader) {
        return
    }
    shader.use()
    light.use(shader)
    camera.use(shader)
    objects.forEach(function(mesh) {
        mesh.draw(shader)
    })
}

Renderer.prototype.renderBacteria = function(camera, light, objects, gl) {
    var shader = this.shader
    if (!shader) {
        return
    }
    shader.use()
    light.use(shader)
    camera.use(shader)
    objects.forEach(function(mesh) {
        mesh.drawBacteria(shader)
    })
}