export const PaystackExtension = {
    name: 'Payment',
    type: 'effect',
    match: ({ trace }) =>
      trace.type === 'ext_pay' || trace.payload.name === 'ext_pay',
    effect: ({ trace, element }) => {
  
      console.log("Here's the email: ", trace.payload.email, trace.payload.amount)
  
      let handler = PaystackPop.setup({
        key: 'pk_test_*******************************', // Replace with your public key
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