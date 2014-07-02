// ==UserScript==
// @name        netcool clip
// @version     0.3
// @description		ALL UR CLIPBOARD ARE BELONG TO US  -  copy2clipboard hack - thank you, you are making our job easier
// @include 
// @include 
// @include 
// @include 
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
0.3 - capoturno mail, ibtool btns
*/

/* WHAT & HOW
http://stackoverflow.com/tags/userscripts/info

enablePrivilege("UniversalXPConnect") was removed in later version of GECKO so in case they will update Citrix/Netcool version of Firefox (now 3.6.8) use GreaseMonkey's setClipboard() or 
if you can/want use another browser check some Flash copy-to-clipboard implementation (or maybe in distant future there will be some HTML7 standard for copy2clipboard)
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
user_pref("browser.startup.homepage_override.mstone", "rv:1.9.2.28");
user_pref("capability.principal.codebase.p0.granted", "UniversalXPConnect");
user_pref("capability.principal.codebase.p0.id", "https://1.2.3.4:16311");
user_pref("capability.principal.codebase.p0.subjectName", "");
user_pref("signed.applets.codebase_principal_support", true);
*/

location.replace("javascript:(" + function() {
	var node;
	var nodeIP;
	var group;
	var summary;
	var sev;
	var agent;
	var wfi = false;

	var checkForFincantieri = true; 

	function prepare() {
		var b = document.getElementsByTagName("b");
		var i = b.length;
		while(i--) {
			val = b[i].nextSibling.nodeValue;
		    switch ( b[i].textContent.trim() ){
		        case "Node":
		            /* exceptions:
									wnt_tsm_server2
									wan_itarhrn03_cluster
									edi_ediprdbm_01_E -> hostname is: ediprdbm_01
									edi_ediprdbm_01_A
									wnt_tsm_server2   -> tsm_server2  
								  	bsm_pasi00        -> pasi00  
								  	wbg_itmi1axp26_B  -> itmi1axp26
								  	wbr_mpp03_A_SQLSERVER -> mpp03
		            after gathering enough data, refactorize*/
		            full_node=val;
		            arr = val.split("_")
		            node = (arr[2] && arr[2].length > 1 && arr[2] != "cluster") ? val.slice(4) : arr[1]
		            // simple & dirty & lazy:P   - edi_ediprdbm_01_E -> hostname is: ediprdbm_01
		            if (arr[3]) { node = val.slice(4,-2) }
		            if (arr[0] == "wfi") { wfi = true; } // needed for IP change
		        	if (!arr[1]) {node = arr[0]} //sometimes hostname dont have customer prefix f.e.:  ediprdtpcif01
		        	if (arr[3] && arr[3].length > 1)	{node = arr[1]} //wbr_mpp03_A_SQLSERVER -> mpp03
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
			var position = what.indexOf(".");
			cp( what.substr(0, position) + "6" + what.substr(position) );
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
	var address = "@.com";
	var cc = "";
	var subject = "Ticket opened into "+group+" queue - ticket number: ";
	var body = "" +
		"Hello everyone,\n\n" +
		"Best Regards\n";

	//http://stackoverflow.com/questions/75980/best-practice-escape-or-encodeuri-encodeuricomponent
	var mailto = "mailto:"+address+"?subject="+subject+"&cc="+cc+"&body="+encodeURIComponent(body);

	var elements = ['hostname', 'ip', 'group', 'summary', 'ibtool','capoturno','info','agent'].reverse();
	for (var i = 0; i < elements.length; i++) {
	   var el  = document.createElement("input");
	   el.type = "button";
	   el.value= elements[i];
	   el.id   = elements[i];
	   var s   = document.getElementsByTagName("input")[0];
	   s.parentNode.insertBefore(el, s);
	}
	document.getElementById('hostname').addEventListener ("click", function(){ copy(node)       }, true);
	document.getElementById('ip').addEventListener       ("click", function(){ copy(nodeIP,true)}, true);
	document.getElementById('group').addEventListener    ("click", function(){ copy(group)      }, true);
	document.getElementById('summary').addEventListener  ("click", function(){ copy(summary)    }, true);
	document.getElementById('ibtool').addEventListener   ("click", function(){ ib_copy()    }, true);
	document.getElementById('capoturno').addEventListener("click", function(){ location.href = mailto  }, true);
	document.getElementById('info').addEventListener     ("click", function(){ cp(document.getElementsByTagName("pre")[0].innerHTML.replace(/<b>|<\/b>/g,"").replace(/<br>/g,"\n"))    }, true);
	document.getElementById('agent').addEventListener	 ("click", function(){ if (agent) {cp(agent)}else{alert("This is not ITM Agent alert.")}  }, true);

	a = document.createElement('a');
	a.href =  'javascript:var LICENSE="\'THE BEER-WARE LICENSE\' (Revision 42): <@gmail.com> wrote this script. As long as you retain this notice you can do whatever you want with this stuff. If we meet some day, and you think this stuff is worth it, you can buy me a beer in return  -- Adam Dvorak";if (window.confirm(LICENSE)) { } else {window.resizeTo(1100,900);window.location="http://www.animalequality.net/donation";};'; 
	a.innerHTML = "<br /><b>license</b>";
	document.body.appendChild(a);
} + ")()");


/*
zclip:
http://steamdev.com/zclip/#usage

http://commons.oreilly.com/wiki/index.php/Greasemonkey_Hacks/Getting_Started#Pitfall_.237:_location
http://userscripts.org/scripts/show/125936
http://wiki.greasespot.net/Metadata_Block#.40run-at
http://wiki.greasespot.net/DOMContentLoaded
*/
