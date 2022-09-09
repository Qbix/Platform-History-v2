<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8" />
	<title>Accept a payment</title>
	<script src="https://js.stripe.com/v3/"></script>
	<script defer>
		var publishableKey = "<?=$publishableKey?>";
        var paymentIntentClientSecret = "<?=$paymentIntentClientSecret?>";

        if (publishableKey && paymentIntentClientSecret) {
            var stripe = Stripe(publishableKey);
            stripe.retrievePaymentIntent(paymentIntentClientSecret).then(function ({paymentIntent}) {
                switch (paymentIntent.status) {
                    case "succeeded":
                        showMessage("Payment succeeded!");
                        break;
                    case "processing":
                        showMessage("Your payment is processing.");
                        break;
                    case "requires_payment_method":
                        showMessage("Your payment was not successful, please try again.");
                        break;
                    default:
                        showMessage("Something went wrong.");
                        break;
                }
            }).catch(function (err) {
                console.log(err);
            });
		}

        function showMessage(messageText) {
            document.body.textContent = messageText;
        }
	</script>
</head>
<body></body>
</html>