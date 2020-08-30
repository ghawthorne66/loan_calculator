function calculate() {

    //lookup the input and output elements in the document
    var amount = document.getElementById("amount");
    var apr = document.getElementById("apr");
    var years = document.getElementById("years");
    var zipcode = document.getElementById("zipcode");
    var payment = document.getElementById("payment");
    var total = document.getElementById("total");
    var totalinterest = document.getElementById("totalinterest");
    //get the users input from the input elements.  assume it is valid
    //convert interest from a percentage to a decimal, and convert from
    //an annual rate to a monthly rate. convert payment period in years
    //to the number of monthly payments.
    var principal = parseFloat(amount.value);
    var interest = parseFloat(apr.value) / 100 / 12;
    var payments = parseFloat(years.value) * 12;

    //compute the monthly payment figure
    var x = Math.pow(1 + interest, payments);
    var monthly = (principal * x * interest) / (x - 1);

    //if the result is a finite number, the users input was good and
    //we have meaningful results to display
    if (isFinite(monthly)) {
        //fill in the output fields, rounding to two decimals
        payment.innerHTML = monthly.toFixed(2);
        total.innerHTML = (monthly * payments).toFixed(2);
        totalinterest.innerHTML = ((monthly * payments) - principal).toFixed(2);

        //save the users input to restore it the next time they visit
        //save(amount.value, apr.value, years.value, zipcode.value);

        //advertise: find and display local lenders, but ignore network errors

        try {
            getLenders(amount.value, apr.value, years.value, zipcode.value);
        } catch (e) {
            /*ignore these errors*/
        }
        //chart loan balance, and interest equity payments
        //chart(principal,, interest, monthly payments
    } else {
        //result was not a number or infinite which means the input was
        //incomplete or invalid. clear any previously displayed output.
        payment.innerHTML = ""; //erase the content of these elements
        total.innerHTML = "";
        totalinterest.innerHTML = "";
        chart();  //with no arguments, clears the chart
    }
}

//save the users inout as properties of the local storage object.
//those properties will still be there when the user visits in the future.
function save(amount, apr, years, zipcode) {
    if (window.localStorage) {
        localStorage.loan_amount = amount;
        localStorage.loan_apr = apr;
        localStorage.loan_years = years;
        localStorage.loan_zipcode = zipcode;
    }
}

// automatically attempt to restore input fields when the document first loads.
window.onload = function () {
    //if the browser supports local storage and we have some stored data
    if (window.localStorage && localStorage.loan_amount) {
        document.getElementById("amount").value = localStorage.loan_amount;
        document.getElementById("apr").value = localStorage.loan_apr;
        document.getElementById("years").value = localStorage.loan_years;
        document.getElementById("zipcode").value = localStorage.loan_zipcode;
    }
};
//Pass the users input to a server-side script which can (in theory) return
//a list of links to local lenders interested in making loans.  this example does not actually include a working implementation of such lender-finding service. But if the service existed, this function would work with it.
function getLenders(amount, apr, years, zipcode) {
    //if the browser does not support XMLHttpRequest object, do nothing
    if (window.XMLHttpRequest) return;

    //find the element to display a list of vendors
    var ad = document.getElementById("lenders");
    if (!ad) return;  // quit if no spot for output

    //Encode the users inout as query parameters in a url
    var url = "getLenders.php" +  //Service url plus
        "?amt=" + encodeURIComponent(amount) + //user data in query string
        "&apr=" + encodeURIComponent(apr) +
        "&yrs=" + encodeURIComponent(years) +
        "&zip=" + encodeURIComponent(zipcode);

    //fetch new contents of that URK using the XMLHttpRequest object
    var req = new XMLHttpRequest(); //begin a new request
    req.open("GET", url);           //an HTTP GET request for the url
    req.send(null);                 //send the request w no body

    //before returning, register an event handler function that will be called at some later time when the HTTP servers response arrives.  this kind of asynchronous programming is very common in client-side javascript.
    req.onreadystatechange = function () {
        if (req.readyState == 4 && req.status == 200) {
            // if we get here we get a complete valid HTTP response
            var response = req.responseText; //HTTP response as a string
            var lenders = JSON.parse(response); //parse it as a JS array

            //Convert the array of lender objects to a string of HTML
            var list = "";
            for (var i = 0; i < lenders.length; i++) {
                list += "<li><a href=`" + lenders[i].url + "`>" +
                    lenders[i].name + "</a>";
            }
            //Display the HTML in the element from above
            ad.innerHTML = "<ul>" + list + "</ul>"
        }
    }
}
//Chart monthly loan balance, interest and equity in an HTML <canvas> element. If called w no arguments then just erase any previously drawn chart.
function chart(principal, interest, monthly, payments) {
    var graph = document.getElementById("graph"); //get the <canvas> tag
    graph.width = graph.width;; //magic to clear and reset the canvas element

    //if we're called w no arguments, or if the browser does'nt support graphics in a <canvas> element, then just return now.
    if (arguments.length == 0 || !graph.getContext) return;

    //Get the "context" object for the <canvas> that defines the drawing API
    var g = graph.getContext("2d"); //all drawing is done w this object
    var width = graph.width, height = graph.height; //get canvas size

    //these functions convert payment numbers and amounts to pixels
    function paymentTax(n) { return n * width/payments; }
    function amountToy(a) {
        return height-(a * height/(monthly*payments*1.05))
    }
}