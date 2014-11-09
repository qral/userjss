// ==UserScript==
// @name        netcool clip
// @namespace   @gmail.com
// @version     0.3.4
// @description		ALL UR CLIPBOARD ARE BELONG TO US  -  copy2clipboard hack - thank you, you are making our job easier
// @include https://111.222.333.444/ibm/console/contentRender.do*
// @include https://111.222.333.444/ibm/console/contentRender.do*
// @include https://111.222.333.444:555/ibm/console/contentRender.do*
// @include https://111.222.333.444:555/ibm/console/contentRender.do*
// @run-at document-start
// @license BEERWARE
// ==/UserScript==

/*
 * ----------------------------------------------------------------------------
 * "THE BEER-WARE LICENSE" (Revision 42):
 * <@gmail.com> wrote this file. As long as you retain this notice you
 * can do whatever you want with this stuff. If we meet some day, and you think
 * this stuff is worth it, you can buy me a beer in return Adam Dvorak
 * ----------------------------------------------------------------------------
 */

/*  - VERSIONS -
0.1 - 1st rls
0.2 - proper hostname copy
0.3 - capoturno mail; ibtool btns
0.3.1 - ibtool img in btn; better handling of hostnames
0.3.2 - prevent to change fincantieri IP if it is already the right one (106.)
0.3.3 - no more scrollbars (resize window to see license ;)
0.3.4 - wcd_cdp_tsm_ibm -> cdp_tsm_ibm
*/

/* WHAT & HOW
http://stackoverflow.com/tags/userscripts/info

enablePrivilege("UniversalXPConnect") was removed in later version of GECKO so in case they will update Citrix/Netcool version of Firefox (now 3.6.8) use GreaseMonkey's setClipboard() or if you can/want use another browser check some Flash copy-to-clipboard implementation (or maybe in distant future there will be some HTML7 standard for copy2clipboard)
https://developer.mozilla.org/en-US/docs/Bypassing_Security_Restrictions_and_Signing_Code
http://stackoverflow.com/a/13963632/1136008
-> EnablePrivilege is disabled in Firefox 15 and will be removed in Firefox 17.
http://wiki.greasespot.net/GM_setClipboard

PREREQUISITIES:
signed.applets.codebase_principal_support in about:config to TRUE, after that you will be prompted
=> http://kb.mozillazine.org/Granting_JavaScript_access_to_the_clipboard

https://support.mozilla.org/en-US/questions/977068
http://kb.mozillazine.org/Granting_JavaScript_access_to_the_clipboard
https://addons.mozilla.org/en-us/firefox/addon/allowclipboard-helper/

or just create user.js file in profile root
// netcool whitelist for copy to clipboard functionality
user_pref("browser.startup.homepage", "https://195.183.244.178:16311/ibm/console/logon.jsp");
user_pref("browser.startup.homepage_override.mstone", "rv:1.9.2.28");
user_pref("capability.principal.codebase.p0.granted", "UniversalXPConnect");
user_pref("capability.principal.codebase.p0.id", "https://195.183.244.178:16311");
user_pref("capability.principal.codebase.p0.subjectName", "");
user_pref("capability.principal.codebase.p1.granted", "UniversalXPConnect");
user_pref("capability.principal.codebase.p1.id", "https://195.183.244.187:16311");
user_pref("capability.principal.codebase.p1.subjectName", "");
user_pref("signed.applets.codebase_principal_support", true);
*/

location.replace("javascript:(" + function() {
	// stop loading - replaced by @run-at document-start
	//setTimeout("window.stop()", 2000);
	var node;
	var nodeIP;
	var group;
	var summary;
	var sev;
	var agent;
	var wfi = false;

	//FALSE if you want original Fincantiery IPs to which we are unable to connect.
	var checkForFincantieri = true; 

	function prepare() {
		var b = document.getElementsByTagName("b");
		var i = b.length;
		while(i--) {
			val = b[i].nextSibling.nodeValue;
		    switch ( b[i].textContent.trim() ){
		        case "Node":
		            /* exceptions:
						wan_itarhrn03_cluster
						edi_ediprdbm_01_E -> hostname is: ediprdbm_01
						edi_ediprdbm_01_A
						wnt_tsm_server2   -> tsm_server2  
						bsm_pasi00        -> pasi00  
						wbg_itmi1axp26_B  -> itmi1axp26
						wbr_mpp03_A_SQLSERVER -> mpp03
						wcd_cdp_tsm_ibm       -> cdp_tsm_ibm
						gee_miapp_scfp2   -> miapp_scfp2
		            after gathering enough data, refactorize
		            zatím to vypadá že stačí počekovat všechno mezi XXX_HOSTNAME-cokoliv-dokud-neni-jedno-pismenko||cluster
		            */
		            full_node=val;
		            arr = val.split("_")
		            node = (arr[2] && arr[2].length > 1 && arr[2] != "cluster") ? val.slice(4) : arr[1]
		            if (arr[3]) { node = val.slice(4,-2) } // simple & dirty & lazy:P   - edi_ediprdbm_01_E -> hostname is: ediprdbm_01
		            if (arr[0] == "wfi") { wfi = true; } // needed for IP change
		        	if (!arr[1]) {node = arr[0]} //sometimes hostname dont have customer prefix f.e.:  ediprdtpcif01
		        	if (arr[3] && arr[3].length > 1)	{node = arr[1]} //wbr_mpp03_A_SQLSERVER -> mpp03
					if (arr[3] && arr[2].length > 1 && arr[3].length > 1)	{node = val.slice(4)} //wcd_cdp_tsm_ibm -> cdp_tsm_ibm
		            break;       
		        case "Node Alias":
		            nodeIP = val;
		            break;
		        case "Ticket Group":
		            group = val;
		            break;
		        case "Summary":
		            summary = val;
		            // copy just agent part -> MPPCL03:wbr_mpp03_A_SQLSERVER:MS
		            // Summary is:
		            // ITM Agent Offline: MPPCL03:wbr_mpp03_A_SQLSERVER:MS
		            //  or can be also this:
		            // (Received during suppression) ITM Agent Offline: wcd_cdptmg04:NT
		            position = val.indexOf("ITM Agent Offline:")
		            if ( position >= 0)  { agent = val.slice(position+19) };
		            break;
		        case "Ticket Severity":
		            sev = val;
		            break;		            
		        //default:            
		    }
		}
	};
	prepare();

	// copy to clipboard function
	function cp(str) {
		netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
		var clip = Components.classes["@mozilla.org/widget/clipboardhelper;1"].getService(Components.interfaces.nsIClipboardHelper);
		clip.copyString( str );
	}

	function copy(what,ip) {
		if (wfi && ip && checkForFincantieri == true) {
			// maybe they fixed it, but I spotted fincantieri with 106. IP address
			if (what[2] != "6") {
				// 10.1.28.172 -> 106.1.28.172
				var position = what.indexOf(".");
				cp( what.substr(0, position) + "6" + what.substr(position) );
			} else { cp( what ); }
		} else {
			cp( what );
		}
	}

	//output should be: "w82_dbt10cnhx^(Received during suppression) Oracle ctf2001c invalid objects:19.^^w82^^^^^^[Tue May 27 22:32:31 2014]^^"
	function ib_copy() {
		// required time format - one-liner
		time = new Date().toString().split("GMT")[0].replace(" 2014","")+"2014";
		//str = full_node +"^"+ summary +"^^"+ arr[0] +"^^^^^^["+ time +"]^^";
		/* ibtool can't handle hostname_XXX; who cares can file a bug - thanks
		xjb_dbs00gjbx_new -> dbs00gjbx_new
		wfd_sql_server    -> sql_server
		dirty hack - should work: .split("_")[0]  still you need to correct filled values..
		*/
		str = node.split("_")[0] +"^"+ summary +"^^"+ arr[0] +"^^^^^^["+ time +"]^^";
		cp( str );
	}

	// TODO: rich-text formatting? BOLD?  \b turns on bold, whereas \b0
	// looks like it's impossible
	var address = "@.com, @.com, @.com";
	var cc = "CC BRNO DISTRIBUTED/Czech Republic/IBM";
	var subject = "Ticket opened into "+group+" queue - ticket number: ";
	var body = "" +
		"Hello everyone,\n\n" +
		"we have opened ticket  into "+group+" queue.\n\n" +
		"Ticket number:    \n\n" +
		"Severity:  "+sev+"\n\n" +
		"Description:      "+summary+"\n\n\n" +
		"Please be so kind and check it.\n\n" +
		"Best Regards\n" +
		"___________________________________\n" +
		"Command Center Distributed Monitoring\n" +
		"Delivery Center Brno, Czech Republic\n" +
		"Phone: +420  / +420 \n" +
		"Mobile: +420  / +420 \n" +
		"Email: @ibm.com\n" +
		"BlueGroup (sametime): ITALY CC Distributed\n";
	//http://stackoverflow.com/questions/75980/best-practice-escape-or-encodeuri-encodeuricomponent
	var mailto = "mailto:"+address+"?subject="+subject+"&cc="+cc+"&body="+encodeURIComponent(body);
	//var mailto = "mailto:"+address+"?subject="+subject+"&cc="+cc+"&body="+encodeURIComponent("{\b\i Patiënt\b0\i0} {\strike Patiënt\strike0} {\unline Patiënt\unline0} {\i Patiënt\i} {\b Patint\b0}");
	//var mailto = "mailto:"+address+"?subject="+subject+"&cc="+cc+"&body="+encodeURI(body);

	var elements = ['hostname', 'ip', 'group', 'summary', 'ibtool','capoturno','info','agent'].reverse();
	for (var i = 0; i < elements.length; i++) {
	   var el  = document.createElement("input");
	   el.type = "button";
	   el.value= elements[i];
	   el.id   = elements[i];
	   var s   = document.getElementsByTagName("input")[0];
	   s.parentNode.insertBefore(el, s);
	}

	a = document.createElement('a');
	a.href =  'javascript:var LICENSE="\'THE BEER-WARE LICENSE\' (Revision 42): <@gmail.com> wrote this script. As long as you retain this notice you can do whatever you want with this stuff. If we meet some day, and you think this stuff is worth it, you can buy me a beer in return  -- Adam Dvorak";if (window.confirm(LICENSE)) { } else {window.resizeTo(1100,900);window.location="http://www.animalequality.net/donation";};'; 
	a.innerHTML = "<br /><b>license</b>";
	document.body.appendChild(a);

	var zaba = "data:image/png;base64,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";
	ibtool_btn = document.createElement('a');
	ibtool_btn.innerHTML = '<button type="submit" id="ibtool"><img src='+zaba+' width="13px" align="absmiddle"> ibtool</button>';
	//document.body.appendChild(ibtool_btn);
	// http://stackoverflow.com/questions/4793604/how-to-do-insert-after-in-javascript-without-using-a-library
	var ib = document.getElementById('ibtool');
	//ib.parentNode.insertBefore(ibtool_btn, ib.nextSibling);
	ib.parentNode.replaceChild(ibtool_btn, ib);
	//zkus normalne pres inner html nahradit ten puvodní button co vytvarim ve for cyklu
	//document.getElementById('ibtool').innerHTML = ibtool_btn; //nefunguje

	document.getElementById('hostname').addEventListener ("click", function(){ copy(node)       }, true);
	document.getElementById('ip').addEventListener       ("click", function(){ copy(nodeIP,true)}, true);
	document.getElementById('group').addEventListener    ("click", function(){ copy(group)      }, true);
	document.getElementById('summary').addEventListener  ("click", function(){ copy(summary)    }, true);
	document.getElementById('ibtool').addEventListener   ("click", function(){ ib_copy()    }, true);
	document.getElementById('capoturno').addEventListener("click", function(){ location.href = mailto  }, true);
	document.getElementById('info').addEventListener     ("click", function(){ cp("BlueCARE Netcool Event Information\n\n"+document.getElementsByTagName("pre")[0].innerHTML.replace(/<b>|<\/b>/g,"").replace(/<br>/g,"\n"))    }, true);
	document.getElementById('agent').addEventListener	 ("click", function(){ if (agent) {cp(agent)}else{alert("This is not ITM Agent alert.")}  }, true);

	// resize pop-up window so we can see license link;)
	// return TRUE if scrollbar is visible
	var hasVScroll = document.body.scrollHeight > document.body.clientHeight;
	//alert(hasVScroll);
	if (hasVScroll) { window.resizeTo(window.outerWidth,document.body.scrollHeight+30) }
} + ")()");





/*
zclip:
http://steamdev.com/zclip/#usage

http://commons.oreilly.com/wiki/index.php/Greasemonkey_Hacks/Getting_Started#Pitfall_.237:_location
http://userscripts.org/scripts/show/125936
http://wiki.greasespot.net/Metadata_Block#.40run-at
http://wiki.greasespot.net/DOMContentLoaded
*/
