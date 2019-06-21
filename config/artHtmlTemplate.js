module.exports = {
	template :`<!DOCTYPE html>
		<html>
		<head>
		<meta name="viewport" content="width=device-width, initial-scale=1">
		<link rel="manifest" href="./manifest.json">
		<script src="https://cdn.auth0.com/js/auth0/9.5.1/auth0.min.js"></script>
		<style>
		body {font-family: Arial, Helvetica, sans-serif;}

		/* Full-width input fields */
		input[type=text], input[type=password] {
			width: 100%;
			padding: 12px 20px;
			margin: 8px 0;
			display: inline-block;
			border: 1px solid #ccc;
			box-sizing: border-box;
		}

		/* Set a style for all buttons */
		button {
			background-color: #4CAF50;
			color: white;
			padding: 14px 20px;
			margin: 8px 0;
			border: none;
			cursor: pointer;
			width: 100%;
		}

		button:hover {
			opacity: 0.8;
		}

		/* Extra styles for the cancel button */
		.cancelbtn {
			width: auto;
			padding: 10px 18px;
			background-color: #f44336;
		}

		/* Center the image and position the close button */
		.imgcontainer {
			text-align: center;
			margin: 24px 0 12px 0;
			position: relative;
		}

		img.avatar {
			width: 5%;
			height:5%;
		}

		.container {
			padding: 16px;
		}

		span.psw {
			float: right;
			padding-top: 16px;
		}

		/* The Modal (background) */
		.modal {
			display: none; /* Hidden by default */
			position: fixed; /* Stay in place */
			z-index: 1; /* Sit on top */
			left: 0;
			top: 0;
			width: 100%; /* Full width */
			height: 100%; /* Full height */
			overflow: auto; /* Enable scroll if needed */
			background-color: rgb(0,0,0); /* Fallback color */
			background-color: rgba(0,0,0,0.4); /* Black w/ opacity */
			padding-top: 60px;
		}

		/* Modal Content/Box */
		.modal-content {
			background-color: #fefefe;
			margin: 5% auto 15% auto; /* 5% from the top, 15% from the bottom and centered */
			border: 1px solid #888;
			width: 80%; /* Could be more or less, depending on screen size */
		}

		/* The Close Button (x) */
		.close {
			position: absolute;
			right: 25px;
			top: 0;
			color: #000;
			font-size: 35px;
			font-weight: bold;
		}

		.close:hover,
		.close:focus {
			color: red;
			cursor: pointer;
		}

		/* Add Zoom Animation */
		.animate {
			-webkit-animation: animatezoom 0.6s;
			animation: animatezoom 0.6s
		}

		@-webkit-keyframes animatezoom {
			from {-webkit-transform: scale(0)} 
			to {-webkit-transform: scale(1)}
		}
			
		@keyframes animatezoom {
			from {transform: scale(0)} 
			to {transform: scale(1)}
		}

		/* Change styles for span and cancel button on extra small screens */
		@media screen and (max-width: 300px) {
			span.psw {
			   display: block;
			   float: none;
			}
			.cancelbtn {
			   width: 100%;
			}
		}
		</style>
		</head>
		<body>





		<div id="id01" class="modal" style="display:block">
		  
		  <form class="modal-content animate">
			<div class="imgcontainer">
			  <span onclick="window.close()" class="close" id='close' title="Close Modal">&times;</span>
			  <img src="./images/imageName" alt="Avatar" class="avatar">
			</div>

			<div class="container">
				containerBody
			  <label>
				<span id="status"></span>
			  </label>
			</div>
		  </form>
		</div>
		<script>

		var webAuth;
		var session = window.location.href.split('=')[1];
		//console.log(session);

		function validateLogin() {
			var xmlhttp = new XMLHttpRequest();
			xmlhttp.onreadystatechange = function() {
				if (this.readyState == 4){
					if(this.status == 200) {	
					document.getElementById("status").innerHTML="";
					var accDet = JSON.parse(this.responseText).accDet;
					//console.log(accDet);
					alert(accDet);
					document.getElementById("close").click();
					}else if(this.status == 400){
						//console.log('hari');
						var stat = JSON.parse(this.responseText).status
						if(stat.indexOf('invalid')>=0){
							document.getElementById("status").innerHTML = "invalid username/password";
						}else{
							document.getElementById("status").innerHTML = "Technical issue for validate username/password, Please try again later";
						}
						
					}
				}
			};
			xmlhttp.open("POST",  "https://df8qy9srl5.execute-api.us-east-1.amazonaws.com/V1");
			xmlhttp.setRequestHeader("Content-Type", "application/json");
			xmlhttp.setRequestHeader("authorization", "Bearer 94f86c27675a457c8963b870b1b4095a");
			xmlhttp.send(ajaxParameters);	
		}

		</script>

		</body>
		</html>
	`,
	"changePassword":{
		containerBody:`<div id="containerBody">
		  <label for="uname"><b>Emp ID</b></label>
		  <input type="text" placeholder="Emp ID" id = "uname" name="uname" required>
		  <label for="pwd"><b>Password</b></label>
		  <input type="password" placeholder="Password" id = "pwd" name="pwd" required> 
		  <label for="uname"><b>New Password</b></label>
		  <input type="password" placeholder="New Password" id = "newpwd" name="newpwd" required>
		  <label for="uname"><b>Confirm Password</b></label>
		  <input type="password" placeholder="confirm password" id = "confpwd" name="confpwd" required>		  
		  <button type="button" onClick="validateLogin()">Login</button>
	  </div>`,
		image:'Change.png',
		endPoint:'changePassword',
		params:`JSON.stringify({queryResult:{parameters:{username:document.getElementById("uname").value,passwd:document.getElementById("pwd").value,newPasswd:document.getElementById("newpwd").value,confPasswd:document.getElementById("confpwd").value},action:'changePassword',actionIncomplete:true,intent:{displayName:'changepassword_art'},queryText:'change password'},source:'artwebview',key:session})`
	},
	"resetPassword":{
		containerBody:`<div id="containerBody">
		  <label for="uname"><b>New Password</b></label>
		  <input type="password" placeholder="New Password" id = "newpwd" name="newpwd" required>
		  <label for="uname"><b>Confirm Password</b></label>
		  <input type="password" placeholder="confirm password" id = "confpwd" name="confpwd" required>		  
		  <button type="button" onClick="validateLogin()">Submit</button>
	  </div>`,
		image:'Reset.png',
		endPoint:'resetPasswordFinal',
		params:`JSON.stringify({queryResult:{parameters:{newPasswd:document.getElementById("newpwd").value,confPasswd:document.getElementById("confpwd").value},action:'resetPasswordFinal',actionIncomplete:true,intent:{displayName:'resetpassword_art'},queryText:'reset password',actionmethod:'securityquestions'},key:session,source:'artwebview'})`
	},
	"unlockaccount":{
		containerBody:`<div id="containerBody">
		  <label for="uname"><b>New Password</b></label>
		  <input type="password" placeholder="New Password" id = "newpwd" name="newpwd" required>
		  <label for="uname"><b>Confirm Password</b></label>
		  <input type="password" placeholder="confirm password" id = "confpwd" name="confpwd" required>		  
		  <button type="button" onClick="validateLogin()">Submit</button>
	  </div>`,
		image:'Reset.png',
		endPoint:'resetmobileotpfinal',
		params:`JSON.stringify({queryResult:{parameters:{newPasswd:document.getElementById("newpwd").value,confPasswd:document.getElementById("confpwd").value},action:'resetPasswordFinal',actionIncomplete:true,intent:{displayName:'resetpassword_art'},queryText:'reset password',actionmethod:'mobileotp'},key:session,source:'artwebview'})`
	},
	"enroll":{
		containerBody:`<div id="containerBody">
			  <label for="uname"><b>Emp ID</b></label>
			  <input type="text" placeholder="Emp ID" id = "uname" name="uname" required>
			  <label for="pwd"><b>Password</b></label>
			  <input type="password" placeholder="Password" id = "pwd" name="pwd" required> 	  
			  <button type="button" onClick="validateLogin()">Login</button>
			</div>`,
		image:'Enrollment.png',
		endPoint:'EnrollmentUservalidation',
		params:`JSON.stringify({queryResult:{parameters:{empId:document.getElementById("uname").value,currentPassword:document.getElementById("pwd").value},action:'EnrollmentUservalidation',actionIncomplete:true,intent:{displayName:'enrollment_art'},queryText:'User Enrollment'},key:session,source:'artwebview'})`
	}
	
}