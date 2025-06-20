'use strict';



const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout {
    date = new Date();
    id = (Date.now() + '').slice(-10);

    constructor(coords, distance, duration) {
        this.coords = coords;
        this.distance = distance;
        this.duration = duration;
    };

    getDescribe() {
        // prettier-ignore
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        this.describe = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDay()}`
    };

};

class Running extends Workout {
    type = 'running';
    constructor(coords, distance, duration, cadence) {
        super(coords, distance, duration);
        this.cadence = cadence;
        this.calcPace();
        this.getDescribe();
    };

    calcPace() {
        this.pace = this.duration / this.distance;
        return this.pace;
    };
};

class Cycling extends Workout {
    type = 'cycling';
    constructor(coords, distance, duration, elevation) {
        super(coords, distance, duration);
        this.elevation = elevation;
        this.calcSpeed();
        this.getDescribe();
    };

    calcSpeed() {
        this.speed = this.distance / (this.duration / 60);
        return this.pace;
    };
};





class App {
    #map;
    #mapEvent;
    #mapZoom = 13;
    #workouts = [];
    constructor() {
        // get user location
        this._getPosition();

        // get the data from the local storage
        this._getDataLocalStorage();

        // Event Handler Functions
        form.addEventListener('submit', this._newWorkout.bind(this));
        inputType.addEventListener('change', this._toggleElevationField);
        containerWorkouts.addEventListener('click', this._movePopOut.bind(this))
        // Event Handler Functions

    }

    _getPosition() {
        navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), function () {
            window.alert('we could not find your position');
        });
    };

    _loadMap(position) {
        const { latitude, longitude } = position.coords;
        const coords = [latitude, longitude];
        this.#map = L.map('map').setView(coords, this.#mapZoom);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map);

        this.#map.on('click', this._showForm.bind(this));

        this.#workouts.forEach(workout => {
            this._renderWorkoutMarker(workout);

        });
    };

    _showForm(mapE) {
        this.#mapEvent = mapE;
        form.classList.remove('hidden');
        inputDistance.focus();
    };


    _hideForm() {
        // Clear inputs form
        inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = "";

        // hide form
        form.style.display = 'none';
        form.classList.add('hidden');
        setTimeout(() => form.style.display = 'grid', 1000);
    }

    _toggleElevationField() {
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    };

    _newWorkout(e) {
        e.preventDefault();

        // functions for vaildate inputs
        const validInputs = (...inputs) => inputs.every(inp => Number.isFinite(inp));
        const allPositive = (...inputs) => inputs.every(inp => inp > 0);

        // Get data from form
        const type = inputType.value;
        const distance = +inputDistance.value;
        const duration = +inputDuration.value;
        const { lat, lng } = this.#mapEvent.latlng;
        let workout;

        // If workout running, Create running obejct
        if (type === 'running') {
            const cadence = +inputCadence.value;
            // Check if data is valid
            if (!validInputs(distance, duration, cadence) || !allPositive(distance, duration, cadence)) {
                return alert('Inputs have to be positive numbers!');
            };
            workout = new Running([lat, lng], distance, duration, cadence);
        };

        // If workout cycling, Create cycling obejct
        if (type === 'cycling') {
            const elevation = +inputElevation.value;
            if (!validInputs(distance, duration, elevation) || !allPositive(distance, duration)) {
                return alert('Inputs have to be positive numbers!');
            };
            workout = new Cycling([lat, lng], distance, duration, elevation);
        };

        // Add new object to workout array
        this.#workouts.push(workout)
        // console.log(workout);

        // Render the map Marker
        this._renderWorkoutMarker(workout);

        // Render the map list
        this._renderWorkout(workout);

        // hide form + clear inputs
        this._hideForm();

        // set data from local storage
        this._setDataLocalStorage();
    };

    _renderWorkoutMarker(workout) {
        L.marker(workout.coords)
            .addTo(this.#map)
            .bindPopup(L.popup({
                maxWidth: 250,
                minWidth: 100,
                autoClose: false,
                closeOnClick: false,
                className: `${workout.type}-popup`,
            }))
            .setPopupContent(`${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.describe}`)
            .openPopup();
    };

    _renderWorkout(workout) {
        let html = `
        <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.describe}</h2>
          <div class="workout__details">
            <span class="workout__icon">${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'}</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
        `
        if (workout.type === 'running') {
            html += `
            <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
            `
        }

        if (workout.type === 'cycling') {
            html += `
            <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevation}</span>
            <span class="workout__unit">m</span>
          </div>            
            `
        };

        form.insertAdjacentHTML('afterend', html);

    };

    _movePopOut(e) {
        const workoutEl = e.target.closest('.workout');
        // console.log(workoutEl);

        if (!workoutEl) return;

        const workout = this.#workouts.find(work => work.id === workoutEl.dataset.id);
        // console.log(workout);

        this.#map.setView(workout.coords, this.#mapZoom, {
            animate: true,
            pan: {
                duration: 1,
            },
        });

    };

    _setDataLocalStorage() {
        localStorage.setItem('workouts', JSON.stringify(this.#workouts))
    };

    _getDataLocalStorage() {
        const data = JSON.parse(localStorage.getItem('workouts'));


        if (!data) return;

        this.#workouts = data;

        this.#workouts.forEach(workout => {
            this._renderWorkout(workout);
        });
    };

    reset() {
        localStorage.removeItem('workouts');
        location.reload();
    }

};
const app = new App();
