javascript:
function SelectElement(ajdy,valueToSelect)
{    
    var element = document.getElementById(ajdy);
    element.value = valueToSelect;
}

element=document.getElementById("global_table_country");
element.value = "global_entire_option_dropdown";
element.onchange();
SelectElement("ServiceTypeDropdown","WinLocalProfile"); /* WIN local */
/*
//SelectElement("global_table_country","global_entire_option_dropdown"); //country ALL
//SelectElement("global_table_customer","global_entire_option_dropdown"); //customer ALL
*/

//sleep
var startTime = new Date().getTime();
while (new Date().getTime() < startTime + 1000); //1 sec

document.getElementsByClassName("button_inline")[0].onclick();
