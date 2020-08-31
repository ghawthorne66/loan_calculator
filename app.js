"use strict";
function calculate() {

    //lookup the input and output elements in the document
    var amount = document.getElementById("amount");
    var apr = document.getElementById("apr");
    var years = document.getElementById("years");
    var zipcode = document.getElementById("zipcode");
    var payment = document.getElementById("payment");
    var total = document.getElementById("total");
    var totalInterest = document.getElementById("totalinterest");
    //get the users input from the input elements.  assume it is valid
    //convert interest from a percentage to a decimal, and convert from
    //an annual rate to a monthly rate. convert payment period in years
    //to the number of monthly payments.
    var principal = parseFloat(amount.value);
    var interest = parseFloat(apr.value) / 100 / 12;
    var payments = parseFloat(years.value) * 12;

    //compute the monthly payment figure
    var x = Math.pow(1 + interest, payments);
    var monthly = (principal*x*interest) / (x-1);

    //if the result is a finite number, the users input was good and
    //we have meaningful results to display
    if (isFinite(monthly)) {
        //fill in the output fields, rounding to two decimals
        payment.innerHTML = monthly.toFixed(2);
        total.innerHTML = (monthly * payments).toFixed(2);
        totalInterest.innerHTML = ((monthly * payments) - principal).toFixed(2);

        //save the users input to restore it the next time they visit
        //save(amount.value, apr.value, years.value, zipcode.value);

        //advertise: find and display local lenders, but ignore network errors

        try {
            getLenders(amount.value, apr.value, years.value, zipcode.value);
        } catch (e) {
            /*ignore these errors*/
        }
        //chart loan balance, and interest equity payments
        chart(principal, interest, monthly, payments)
    } else {
        //result was not a number or infinite which means the input was
        //incomplete or invalid. clear any previously displayed output.
        payment.innerHTML = ""; //erase the content of these elements
        total.innerHTML = "";
        totalInterest.innerHTML = "";
        chart();  //with no arguments, cle
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
        if (req.readyState === 4 && req.status === 200) {
            // if we get here we get a complete valid HTTP response
            var response = req.responseText; //HTTP response as a string
            var lenders = JSON.parse(response); //parse it as a JS array

            //Convert the array of lender objects to a string of HTML
            var list = "";
            for (var i = 0; i < lenders.length; i++) {
                list += "<li><a href='" + lenders[i].url + "'>" +
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
    graph.width = graph.width;
    //magic to clear and reset the canvas element

    //if we're called w no arguments, or if the browser doesn't support graphics in a <canvas> element, then just return now.
    if (arguments.length === 0 || !graph.getContext) return;

    //Get the "context" object for the <canvas> that defines the drawing API
    var g = graph.getContext("2d"); //all drawing is done w this object
    var width = graph.width, height = graph.height; //get canvas size

    //these functions convert payment numbers and amounts to pixels
    function paymentToX(n) { return n * width / payments; }

    function amountToY(a) {return height-(a * height/(monthly*payments*1.05));
    }

    //Payments are a straight line from (0, 0) to (payments, monthly*payments)
    g.moveTo(paymentToX(0), amountToY(0)); //start at lower left
    g.lineTo(paymentToX(payments),
        amountToY(monthly * payments));
    g.lineTo(paymentToX(payments), amountToY(0)); //down to lower right
    g.closePath(); //and back to start
    g.fillStyle = "#f88"; //light red
    g.fill();
    g.font = "bold 12px sans-serif";
    g.fillText("Total Interest Payments", 20, 20) //draw text in legend

    //Cumulative equity is non-linear and trickier to chart
    var equity = 0;
    g.beginPath(); //begin a new shape
    g.moveTo(paymentToX(0), amountToY(0))  //starting at lower left
    for (var p = 1; p <= payments; p++) {
        // for each payment figure out the interest
        var thisMonthsInterest = (principal-equity)*interest;
        equity += (monthly - thisMonthsInterest);//the rest goes to equity
        g.lineTo(paymentToX(p), amountToY(equity)); //line to this point
    }
    g.lineTo(paymentToX(payments), amountToY(0)); //Line back to X axis
    g.closePath(); //and back to start point
    g.fillStyle = "green";
    g.fill();
    g.fillText("Total Equity", 20,35)  //label it in green

    //Loop again, as above but chart loan balance as a thick black line
    var bal = principal;
    g.beginPath();
    g.moveTo(paymentToX(0), amountToY(bal));
    for (var p = 1; p <= payments; p++) {
        var thisMonthsInterest = bal*interest;
        bal -= (monthly - thisMonthsInterest);  //the rest goes to equity
        g.lineTo(paymentToX(p),amountToY(bal)); //draw line to this point
    }
    g.lineWidth = 3;
    g.stroke();  //draw the balance curve
    g.fillStyle = "black";
    g.fillText("Loan Balance", 20,50); //legend entry

    //Make yearly tick marks and year numbers on X axis
    g.textAlign = "center";
    var y = amountToY(0);
    for (var year=1; year*12 <= payments; year++) {
        var x = paymentToX(year*12);
        g.fillRect(x-0.5,y-3,1,3);
        if (year == 1) g.fillText("Year", x, y-5);
        if (year % 5 == 0 && year*12 !== payments) //Number every 5 years
            g.fillText(String(year), x, y-5);
    }
//Mark payment amounts along the right edge
    g.textAlign = "right";      //right justify text
    g.textBaseline = "middle";      //center vertically
    var ticks = [monthly*payments, principal];  //the two points we'll mark
    var rightEdge = paymentToX(payments);
    for (var i = 0; i < ticks.length; i++) {
        var y = amountToY(ticks[i]);  //compute Y position of tick
        g.fillRect(rightEdge-3, y-0.5, 3, 1); //draw the tick mark
        g.fillText(String(ticks[i].toFixed(0)),
        rightEdge-5, y) // and label it
    }
}