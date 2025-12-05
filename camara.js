import * as THREE from 'https://cdn.skypack.dev/three@0.132.2';

export class CameraMovement {
    constructor(camera, domElement) {
        this.camera = camera;
        this.domElement = domElement;

        // Configuración de movimiento
        this.moveSpeed = 0.1;
        this.lookSpeed = 0.002;

        this.clickThreshold = 200;
        this.mouseDownTime = 0;
        this.mouseDownPosition = new THREE.Vector2();

        // Estado de teclas
        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false
        };

        // Rotación de cámara
        this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
        //this.euler.setFromQuaternion(camera.quaternion);

        // Bloqueo de puntero
        this.isLocked = false;

        this.setupEventListeners();
    }

    syncRotation() {
        this.euler.setFromQuaternion(this.camera.quaternion);
    }
    setupEventListeners() {
        
        // 1. Guardar el tiempo y posición al presionar el botón del mouse
        this.domElement.addEventListener('mousedown', (event) => {
            if (event.button === 0) { // Botón izquierdo del mouse
                this.mouseDownTime = performance.now();
                this.mouseDownPosition.set(event.clientX, event.clientY);
            }
        });

        // 2. Verificar el tiempo y distancia al soltar el botón
        this.domElement.addEventListener('mouseup', (event) => {
            if (event.button === 0) { // Botón izquierdo del mouse
                const timeElapsed = performance.now() - this.mouseDownTime;
                const positionDelta = this.mouseDownPosition.distanceTo(new THREE.Vector2(event.clientX, event.clientY));
                
                // Un "click simple" es aquel que es rápido y no arrastra el ratón significativamente
                const isShortClick = timeElapsed < this.clickThreshold;
                const isNoDrag = positionDelta < 5; // Añadimos una tolerancia pequeña para el movimiento (5 píxeles)

                if (isShortClick && isNoDrag) {
                    this.domElement.requestPointerLock();
                }
            }
        });
        
        // Eventos de pointer lock
        document.addEventListener('pointerlockchange', () => {
            this.isLocked = document.pointerLockElement === this.domElement;
            const instructions = document.getElementById('instructions');
            if (this.isLocked) {
                this.syncRotation();
                if (controls) controls.enabled = false;
                instructions.classList.add('hidden');
            } else {
                if (controls) controls.enabled = true;
                instructions.classList.remove('hidden');
            }
        });

        // Movimiento del mouse
        document.addEventListener('mousemove', (event) => {
            if (!this.isLocked) return;

            const movementX = event.movementX || 0;
            const movementY = event.movementY || 0;

            this.euler.y -= movementX * this.lookSpeed;
            this.euler.x -= movementY * this.lookSpeed;

            // Limitar rotación vertical
            this.euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.euler.x));
        });

        // Teclas
        document.addEventListener('keydown', (event) => {
            switch (event.code) {
                case 'KeyW': this.keys.forward = true; break;
                case 'KeyS': this.keys.backward = true; break;
                case 'KeyA': this.keys.left = true; break;
                case 'KeyD': this.keys.right = true; break;
                case 'Escape': document.exitPointerLock(); break;
            }
        });

        document.addEventListener('keyup', (event) => {
            switch (event.code) {
                case 'KeyW': this.keys.forward = false; break;
                case 'KeyS': this.keys.backward = false; break;
                case 'KeyA': this.keys.left = false; break;
                case 'KeyD': this.keys.right = false; break;
            }
        });
    }
    update() {
        if (!this.isLocked) return;

        // Actualizar rotación de cámara
        this.camera.quaternion.setFromEuler(this.euler);

        // Vector de dirección
        const direction = new THREE.Vector3();

        if (this.keys.forward) {
            direction.z -= 1;
        }
        if (this.keys.backward) {
            direction.z += 1;
        }
        if (this.keys.left) {
            direction.x -= 1;
        }
        if (this.keys.right) {
            direction.x += 1;
        }

        // Normalizar para movimiento diagonal consistente
        if (direction.length() > 0) {
            direction.normalize();

            // Aplicar movimiento relativo a la rotación de la cámara
            direction.applyQuaternion(this.camera.quaternion);

            this.camera.position.addScaledVector(direction, this.moveSpeed);
        }
    }
}