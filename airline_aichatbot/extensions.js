

export const DateExtension = {
  name: 'Date',
  type: 'response',
  match: ({ trace }) =>
    trace.type === 'ext_date' || trace.payload.name === 'ext_date',
  render: ({ trace, element }) => {
    const formContainer = document.createElement('form')

    // Get current date and time
    let currentDate = new Date()
    let minDate = new Date()
    minDate.setMonth(currentDate.getMonth() - 1)
    let maxDate = new Date()
    maxDate.setMonth(currentDate.getMonth() + 2)

    // Convert to ISO string and remove seconds and milliseconds
    let minDateString = minDate.toISOString().slice(0, 16)
    let maxDateString = maxDate.toISOString().slice(0, 16)

    formContainer.innerHTML = `
          <style>
            label {
              font-size: 0.8em;
              color: #888;
            }
            input[type="datetime-local"]::-webkit-calendar-picker-indicator {
                border: none;
                background: transparent;
                border-bottom: 0.5px solid rgba(0, 0, 0, 0.1);
                bottom: 0;
                outline: none;
                color: transparent;
                cursor: pointer;
                height: auto;
                left: 0;
                position: absolute;
                right: 0;
                top: 0;
                width: auto;
                padding:6px;
                font: normal 8px sans-serif;
            }
            .meeting input{
              background: transparent;
              border: none;
              padding: 2px;
              border-bottom: 0.5px solid rgba(0, 0, 0, 0.1);
              font: normal 14px sans-serif;
              outline:none;
              margin: 5px 0;
              &:focus{outline:none;}
            }
            .invalid {
              border-color: red;
            }
            .submit {
              background: linear-gradient(to right, #2e6ee1, #2e7ff1 );
              border: none;
              color: white;
              padding: 10px;
              border-radius: 5px;
              width: 100%;
              cursor: pointer;
              opacity: 0.3;
            }
            .submit:enabled {
              opacity: 1; /* Make the button fully opaque when it's enabled */
            }
          </style>
          <label for="date">Select your date</label><br>
          <div class="meeting"><input type="date" id="meeting" name="meeting" value="" min="${minDateString}" max="${maxDateString}" /></div><br>
          <input type="submit" id="submit" class="submit" value="Submit" disabled="disabled">
          `

    const submitButton = formContainer.querySelector('#submit')
    const datetimeInput = formContainer.querySelector('#meeting')

    datetimeInput.addEventListener('input', function () {
      if (this.value) {
        submitButton.disabled = false
      } else {
        submitButton.disabled = true
      }
    })
    formContainer.addEventListener('submit', function (event) {
      event.preventDefault()

      const datetime = datetimeInput.value
      console.log(datetime)
      let date = datetime

      formContainer.querySelector('.submit').remove()

      window.voiceflow.chat.interact({
        type: 'complete',
        payload: { date: date},
      })
    })
    element.appendChild(formContainer)
  },
}



export const PaystackExtension = {
  name: 'Payment',
  type: 'effect',
  match: ({ trace }) =>
    trace.type === 'ext_pay' || trace.payload.name === 'ext_pay',
  effect: ({ trace }) => {

    console.log("Here's the email: ", trace.payload.email, trace.payload.amount)

    let handler = PaystackPop.setup({
      key: 'pk_test_e0f88e0ae3e2e22ccc3f6c811643127e2a9525e5', // Replace with your public key
      email: `${trace.payload.email}`,
      amount: `${trace.payload.amount}00`,
      currency: "KES",
      // label: "Optional string that replaces customer email"
      onClose: function(){
        alert('Window closed.');
      },
      callback: function(response){
        let message = 'Payment complete! Reference: ' + response.reference;
        alert(message);
        window.voiceflow.chat.interact({
          type: 'paymentComplete',
          payload: { refNo: response.reference},
        })
      }
    });

    handler.openIframe()
  },
}








// Seat Selection Extension

export const SeatSelectorv2Extension = {
  name: 'SeatSelectorv2',
  type: 'response',
  match: ({ trace }) =>
    trace.type === 'ext_seatselectorv2' ||
    trace.payload.name === 'ext_seatselectorv2',
  render: ({ trace, element }) => {
    const { numberOfSeats , reservedSeats } = trace.payload
    const seatSelectorContainer = document.createElement('div')
    console.log('Reserved seats:', reservedSeats)

    // Fetch and inject CSS
    fetch('https://cdn.jsdelivr.net/npm/seatchart@0.1.0/dist/seatchart.css')
      .then((response) => response.text())
      .then((css) => {
        const style = document.createElement('style')
        style.textContent = css
        seatSelectorContainer.appendChild(style)
      })

    // Create and append script
    const script = document.createElement('script')
    script.src =
      'https://cdn.jsdelivr.net/npm/seatchart@0.1.0/dist/seatchart.min.js'
    script.type = 'text/javascript'
    document.body.appendChild(script)

    seatSelectorContainer.innerHTML = `
     <style>

      .vfrc-message--extension-SeatSelectorv2 {
        background-color: transparent !important;
        background: none !important;
      }

      #container {
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        margin: 0;
        padding: 0;
        width: 275px;
        height: 600px;
        max-width: none;
        transform: scale(0.63);
        transform-origin: top left;
        overflow: visible;
        overflowX: hidden;
        overflowY: hidden;
      }

      .economy {
        color: white;
        background-color: #43aa8b;
      }

      .business {
        color: white;
        background-color: #277da1;
      }

      .premium {
        color: white;
        background-color: #f8961e;
      }

      .sc-seat {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 42px;
        width: 42px;
        margin: 4px;
        box-sizing: border-box;
        border-top-left-radius: 10px;
        border-top-right-radius: 10px;
        user-select: none;
        transition: all 0.1s ease-in-out;
      }

      .sc-seat.sc-seat-available:hover {
        cursor: pointer;
        box-shadow: 0 0 5px rgba(0, 0, 0, 0.3);
      }

      .sc-seat.sc-seat-selected {
        cursor: pointer;
        background-color: black !important;
        color: white !important;
        box-shadow: 0 0 8px rgba(0, 0, 0, 0.5);
      }

      .sc-seat.sc-seat-reserved,
      .sc-seat-reserved {
        color: white;
        background-color: #d2d2d2;
        cursor: not-allowed;
      }

      #buttonContainer {
        display: flex;
        gap: 10px;
        margin-top: 10px;
        transition: opacity 0.3s ease;
      }

      #submitButton, #cancelButton {
        font-size: 16px;
        border: none;
        color: white;
        padding: 10px;
        border-radius: 8px;
        cursor: pointer;
      }

      #submitButton {
        flex: 3;
        background: linear-gradient(to right, #2e6ee1, #2e7ff1);
      }

      #submitButton:hover:not(:disabled) {
        background: linear-gradient(to right, #2558b3, #2669c9);
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
      }

      #cancelButton {
        flex: 1;
        background: linear-gradient(to right, #ff9999, #ff9999);
      }

      #cancelButton:hover:not(:disabled) {
        background: #ff8080;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
      }

      #submitButton:disabled, #cancelButton:disabled {
        background: #ccc;
        cursor: not-allowed;
        color: #666;
        box-shadow: none;
      }

    </style>
    <div id="container"></div>
    <div id="buttonContainer">
      <button id="submitButton">Confirm seat selection</button>
      <button id="cancelButton">Cancel</button>
    </div>`

    // Function to generate random reserved seats
    function generateRandomReservedSeats(totalRows, totalColumns, count) {
      const reservedSeats = []
      const totalSeats = totalRows * totalColumns
      const occupancyRate = 0.3 // 30% of seats will be reserved

      const numberOfReservedSeats = Math.floor(totalSeats * occupancyRate)

      while (reservedSeats.length < numberOfReservedSeats) {
        const row = Math.floor(Math.random() * totalRows)
        const col = Math.floor(Math.random() * totalColumns)
        const seat = { row, col }

        // Check if this seat is already reserved
        if (!reservedSeats.some((s) => s.row === row && s.col === col)) {
          reservedSeats.push(seat)
        }
      }

      return reservedSeats
    }

    // Function to translate reserved seats from seat labels to row and column indices
    function translateReservedSeats(seatLabels) {
      return seatLabels.map((label) => {
        const row = label.charCodeAt(0) - 65
        const col = parseInt(label.slice(1)) - 1
        return { row, col }
      })
    }

    var options = {
      cart: {
        visible: false,
      },
      legendVisible: false,
      map: {
        frontVisible: false,
        indexerColumns: {
          visible: false,
        },
        indexerRows: {
          visible: false,
        },
        rows: 15,
        columns: 7,
        seatTypes: {
          default: {
            label: 'Economy',
            cssClass: 'economy',
            price: 560,
            seatRows: [4, 5, 6, 8, 9, 10, 11, 13, 14],
          },
          first: {
            label: 'Business',
            cssClass: 'business',
            price: 2500,
            seatRows: [0, 1, 2],
          },
          premium: {
            label: 'Premuim',
            cssClass: 'premium',
            price: 680,
            seatColumns: [0, 6],
          },
        },
        disabledSeats: [
          { row: 0, col: 0 },
          { row: 0, col: 6 },
          { row: 14, col: 0 },
          { row: 14, col: 6 },
        ],
        reservedSeats: translateReservedSeats(reservedSeats),
        // reservedSeats: generateRandomReservedSeats(15, 7),
        /* reservedSeats: [
          { row: 0, col: 3 },
          { row: 0, col: 4 },
        ],
        selectedSeats: [{ row: 0, col: 5 }, { row: 0, col: 6 }],*/
        rowSpacers: [3, 7, 12],
        columnSpacers: [2, 5],
      },
    }

    // Wait for both CSS and JS to load before initializing Seatchart
    Promise.all([
      new Promise((resolve) => (script.onload = resolve)),
      fetch(
        'https://cdn.jsdelivr.net/npm/seatchart@0.1.0/dist/seatchart.css'
      ).then((res) => res.text()),
    ]).then(([_, css]) => {
      const style = document.createElement('style')
      style.textContent = css
      seatSelectorContainer.appendChild(style)

      var sc = new Seatchart(
        seatSelectorContainer.querySelector('#container'),
        options
      )

      const submitButton = seatSelectorContainer.querySelector('#submitButton')
      submitButton.disabled = true // Disable button by default
      const cancelButton = seatSelectorContainer.querySelector('#cancelButton')

      let isSubmitted = false

      // Function to update button state and text
      const updateButtonState = () => {
        const selectedSeats = sc.getCart()
        submitButton.disabled =
          selectedSeats.length !== numberOfSeats || isSubmitted
        const buttonContainer =
          seatSelectorContainer.querySelector('#buttonContainer')

        if (isSubmitted) {
          buttonContainer.style.opacity = '0'
          buttonContainer.style.pointerEvents = 'none'
        } else {
          buttonContainer.style.opacity = '1'
          buttonContainer.style.pointerEvents = 'auto'

          if (numberOfSeats === 1) {
            submitButton.textContent = 'Confirm seat selection'
          } else {
            const remainingSeats = numberOfSeats - selectedSeats.length
            if (remainingSeats > 0) {
              submitButton.textContent = `Select ${remainingSeats} more seat${
                remainingSeats !== 1 ? 's' : ''
              }`
            } else {
              submitButton.textContent = 'Confirm seats selection'
            }
          }
        }
      }

      // Add event listener for seat changes
      sc.addEventListener('seatchange', (event) => {
        // console.log('Seat change event:', event)
        updateButtonState()
      })

      // Initial button state update
      updateButtonState()

      // Create a mapping for seat type labels
      const seatTypeLabels = {
        default: 'Economy',
        first: 'Business',
        premium: 'Premium',
      }

      cancelButton.addEventListener('click', function () {
        if (isSubmitted) return

        isSubmitted = true
        updateButtonState()

        // Disable selector and buttons
        seatSelectorContainer.querySelector('#container').style.pointerEvents =
          'none'
        seatSelectorContainer.querySelector('#container').style.opacity = '0.7'

        window.voiceflow.chat.interact({ type: 'canceled' })
      })

      submitButton.addEventListener('click', function () {
        submitButton.textContent = ''
        if (isSubmitted) return

        isSubmitted = true
        updateButtonState()

        var selectedSeats = sc.getCart()
        var total = selectedSeats.reduce((sum, seat) => {
          var seatType = options.map.seatTypes[seat.type]
          return sum + seatType.price
        }, 0)

        // Function to get seat label from Seatchart
        const getSeatLabel = (row, col) => {
          const seatInfo = sc.getSeat({ row, col })
          return seatInfo.label || `${row + 1}${String.fromCharCode(65 + col)}`
        }

        // Function to get the correct seat type label
        const getSeatTypeLabel = (type) => {
          return seatTypeLabels[type] || type
        }

        // Prepare payload
        const payload = {
          selectedSeats: selectedSeats.map((seat) => ({
            label: getSeatLabel(seat.index.row, seat.index.col),
            type: getSeatTypeLabel(seat.type),
            price: options.map.seatTypes[seat.type].price,
          })),
          totalPrice: total,
        }

        // Submit to interact
        window.voiceflow.chat.interact({
          type: 'complete',
          payload: payload,
        })

        // Disable selector and button
        isSubmitted = true
        updateButtonState()

        // Disable the container
        seatSelectorContainer.querySelector('#container').style.pointerEvents =
          'none'
        seatSelectorContainer.querySelector('#container').style.opacity = '0.7'

        console.log('Submitted seats:', payload)
      })
    })
    element.appendChild(seatSelectorContainer)
  },
}






export const AdultFormExtension = {
  name: "Adult Form Extension",
	type: "response",
	match: ({trace}) => trace.type === 'adult_form_extension' || trace.payload.name === 'adult_form_extension',
	render: ({trace, element}) => {
    const formContainer = document.createElement('form')

    const adultIndex = trace.payload.adultIndex

    formContainer.innerHTML = `

      <style>
        label {
          font-size: 0.8em;
          color: #888;
        }
        input, select {
          width: 100%;
          border: none;
          border-bottom: 0.5px solid rgba(0, 0, 0, 0.1);
          background: transparent;
          margin: 5px 0;
          outline: none;
          padding: 8px 0; /* Added some padding for better UX */
        }

        .invalid {
          border-color: red;
        }
        .submit {
          background: linear-gradient(to right, #2e6ee1, #2e7ff1);
          border: none;
          color: white;
          padding: 10px;
          border-radius: 5px;
          width: 100%;
          cursor: pointer;
        }
      </style>

      <h1>Adult ${adultIndex} Details</h1>

      <label for="name">Full Name</label>
      <input type="text" class="name" name="name" required><br><br>

      <label for="email">Email</label>
      <input type="email" class="email" name="email" required pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$" title="Invalid email address"><br><br>

      <label for="phone">Phone Number</label>
      <input type="tel" class="phone" name="phone" required pattern="\\d+" title="Invalid phone number, please enter only numbers"><br><br>

      <label for="dob">Date of Birth</label>
      <input type="text" class="dob" name="dob" required ><br><br>

      <label for="nationality">Nationality</label>
      <input type="text" class="nationality" name="nationality" required ><br><br>

      <label for="doctype">Is there document:</label>
      <select name="doctype" id="doctype" class="doctype" required>
        <option value="Passport">Passport</option>
        <option value="ID Card">ID Card</option>
      </select><br><br>

      <label for="docnumber">Document Number</label>
      <input type="text" class="docnumber" name="docnumber" required ><br><br>

      <label for="membernumber">Member Number</label>
      <input type="text" class="membernumber" name="membernumber" required placeholder="Type Member Number or 'None'"><br><br>

      <label for="address">Physical Address</label>
      <input type="text" class="address" name="address" required><br><br>

      <input type="submit" class="submit" value="Submit">
    
    `

    const name = formContainer.querySelector('.name');
    // name.value = trace.payload.name

    formContainer.addEventListener('input', (e) => {
      e.preventDefault();

      const name = formContainer.querySelector('.name');
      const email = formContainer.querySelector('.email');
      const phone = formContainer.querySelector('.phone');


      if(name.checkValidity()) name.classList.remove('invalid');
      if(email.checkValidity()) email.classList.remove('invalid');
      if(phone.checkValidity()) phone.classList.remove('invalid');
      
    })

    formContainer.addEventListener("submit", (e) => {

      e.preventDefault();

      const name = formContainer.querySelector('.name');
      const email = formContainer.querySelector('.email');
      const phone = formContainer.querySelector('.phone');
      const dob = formContainer.querySelector('.dob');
      const nationality = formContainer.querySelector('.nationality');
      const docType = formContainer.querySelector('.doctype');
      const docNumber = formContainer.querySelector('.docnumber');
      const memberNumber = formContainer.querySelector('.membernumber');
      const address = formContainer.querySelector('.address');

      if(!name.checkValidity()) {
        name.classList.add('invalid')
        email.classList.add('invalid')
        email.classList.add('invalid')
        return
      }

      formContainer.querySelector('.submit').remove()

      window.voiceflow.chat.interact ({
        type: "success",
        payload: {
          name: name.value,
          email: email.value,
          phone: phone.value,
          dob: dob.value,
          nationality: nationality.value,
          docType: docType.value,
          docNumber: docNumber.value,
          memberNumber: memberNumber.value,
          address: address.value
        }
      })
    })

    element.appendChild(formContainer)
  },
}


export const ChildFormExtension = {
  name: "Child Form Extension",
	type: "response",
	match: ({trace}) => trace.type === 'child_form_extension' || trace.payload.name === 'child_form_extension',
	render: ({trace, element}) => {
    const formContainer = document.createElement('form')

    const childIndex = trace.payload.childIndex

    formContainer.innerHTML = `

      <style>
        label {
          font-size: 0.8em;
          color: #888;
        }
        input, select {
          width: 100%;
          border: none;
          border-bottom: 0.5px solid rgba(0, 0, 0, 0.1);
          background: transparent;
          margin: 5px 0;
          outline: none;
          padding: 8px 0; /* Added some padding for better UX */
        }

        .invalid {
          border-color: red;
        }
        .submit {
          background: linear-gradient(to right, #2e6ee1, #2e7ff1);
          border: none;
          color: white;
          padding: 10px;
          border-radius: 5px;
          width: 100%;
          cursor: pointer;
        }
      </style>

      <h1>Child ${childIndex} Details</h1>

      <label for="name">Full Name</label>
      <input type="text" class="name" name="name" required><br><br>

      <label for="dob">Date of Birth</label>
      <input type="text" class="dob" name="dob" required><br><br>

      <label for="nationality">Nationality</label>
      <input type="text" class="nationality" name="nationality" required><br><br>

      <label for="doctype">Document Type</label>
      <select name="doctype" id="doctype" class="doctype" required>
        <option value="Passport">Passport</option>
        <option value="ID Card">ID Card</option>
      </select><br><br>

      <label for="docnumber">Document Number</label>
      <input type="text" class="docnumber" name="docnumber" required><br><br>

      <label for="membernumber">Member Number</label>
      <input type="text" class="membernumber" name="membernumber" required placeholder="Type Member Number or 'None'"><br><br>

      <input type="submit" class="submit" value="Submit">
    
    `

    const name = formContainer.querySelector('.name');
    // name.value = trace.payload.name

    formContainer.addEventListener('input', (e) => {
      e.preventDefault();

      const name = formContainer.querySelector('.name');



      if(name.checkValidity()) name.classList.remove('invalid');

      
    })

    formContainer.addEventListener("submit", (e) => {

      e.preventDefault();

      const name = formContainer.querySelector('.name');
      const dob = formContainer.querySelector('.dob');
      const nationality = formContainer.querySelector('.nationality');
      const docType = formContainer.querySelector('.doctype');
      const docNumber = formContainer.querySelector('.docnumber');
      const memberNumber = formContainer.querySelector('.membernumber');

      if(!name.checkValidity()) {
        name.classList.add('invalid')
        return
      }

      formContainer.querySelector('.submit').remove()

      window.voiceflow.chat.interact ({
        type: "success",
        payload: {
          name: name.value,
          dob: dob.value,
          nationality: nationality.value,
          docType: docType.value,
          docNumber: docNumber.value,
          memberNumber: memberNumber.value
        }
      })
    })

    element.appendChild(formContainer)
  },
}


export const InfantFormExtension = {
  name: "Infant Form Extension",
	type: "response",
	match: ({trace}) => trace.type === 'infant_form_extension' || trace.payload.name === 'infant_form_extension',
	render: ({trace, element}) => {
    const formContainer = document.createElement('form')

    const infantIndex = trace.payload.infantIndex

    formContainer.innerHTML = `

      <style>
        label {
          font-size: 0.8em;
          color: #888;
        }
        input[type="text"], input[type="email"], input[type="tel"] {
          width: 100%;
          border: none;
          border-bottom: 0.5px solid rgba(0, 0, 0, 0.1);
          background: transparent;
          margin: 5px 0;
          outline: none;
          padding: 8px 0; /* Added some padding for better UX */
        }

        .invalid {
          border-color: red;
        }
        .submit {
          background: linear-gradient(to right, #2e6ee1, #2e7ff1);
          border: none;
          color: white;
          padding: 10px;
          border-radius: 5px;
          width: 100%;
          cursor: pointer;
        }
      </style>

      <h1>Infant ${infantIndex} Details</h1>

      <label for="name">Full Name</label>
      <input type="text" class="name" name="name" required><br><br>

      <label for="dob">Date of Birth</label>
      <input type="text" class="dob" name="dob" required><br><br>

      <label for="nationality">Nationality</label>
      <input type="text" class="nationality" name="nationality" required><br><br>

      <input type="submit" class="submit" value="Submit">
    
    `

    const name = formContainer.querySelector('.name');
    // name.value = trace.payload.name

    formContainer.addEventListener('input', (e) => {
      e.preventDefault();

      const name = formContainer.querySelector('.name');


      if(name.checkValidity()) name.classList.remove('invalid');

      
    })

    formContainer.addEventListener("submit", (e) => {

      e.preventDefault();

      const name = formContainer.querySelector('.name');
      const dob = formContainer.querySelector('.dob');
      const nationality = formContainer.querySelector('.nationality');


      if(!name.checkValidity()) {
        name.classList.add('invalid')

        return
      }

      formContainer.querySelector('.submit').remove()

      window.voiceflow.chat.interact ({
        type: "success",
        payload: {
          name: name.value,
          dob: dob.value,
          nationality: nationality.value,
        }
      })
    })

    element.appendChild(formContainer)
  },
}