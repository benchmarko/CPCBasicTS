/* globals cpcBasic */

"use strict";

cpcBasic.addItem("", function () { /*
*/ });

//10 print "testrsx.rsx loaded.""

cpcBasic.addRsx("", function () {
	return {
		getRsxCommands: function () {
			return {
				testrsx: function (s1, n1) {
					this.print(0, s1, n1);
				}
			};
		}
	};
});
