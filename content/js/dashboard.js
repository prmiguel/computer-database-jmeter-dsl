/*
   Licensed to the Apache Software Foundation (ASF) under one or more
   contributor license agreements.  See the NOTICE file distributed with
   this work for additional information regarding copyright ownership.
   The ASF licenses this file to You under the Apache License, Version 2.0
   (the "License"); you may not use this file except in compliance with
   the License.  You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
var showControllersOnly = false;
var seriesFilter = "";
var filtersOnlySampleSeries = true;

/*
 * Add header in statistics table to group metrics by category
 * format
 *
 */
function summaryTableHeader(header) {
    var newRow = header.insertRow(-1);
    newRow.className = "tablesorter-no-sort";
    var cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Requests";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 3;
    cell.innerHTML = "Executions";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 7;
    cell.innerHTML = "Response Times (ms)";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Throughput";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 2;
    cell.innerHTML = "Network (KB/sec)";
    newRow.appendChild(cell);
}

/*
 * Populates the table identified by id parameter with the specified data and
 * format
 *
 */
function createTable(table, info, formatter, defaultSorts, seriesIndex, headerCreator) {
    var tableRef = table[0];

    // Create header and populate it with data.titles array
    var header = tableRef.createTHead();

    // Call callback is available
    if(headerCreator) {
        headerCreator(header);
    }

    var newRow = header.insertRow(-1);
    for (var index = 0; index < info.titles.length; index++) {
        var cell = document.createElement('th');
        cell.innerHTML = info.titles[index];
        newRow.appendChild(cell);
    }

    var tBody;

    // Create overall body if defined
    if(info.overall){
        tBody = document.createElement('tbody');
        tBody.className = "tablesorter-no-sort";
        tableRef.appendChild(tBody);
        var newRow = tBody.insertRow(-1);
        var data = info.overall.data;
        for(var index=0;index < data.length; index++){
            var cell = newRow.insertCell(-1);
            cell.innerHTML = formatter ? formatter(index, data[index]): data[index];
        }
    }

    // Create regular body
    tBody = document.createElement('tbody');
    tableRef.appendChild(tBody);

    var regexp;
    if(seriesFilter) {
        regexp = new RegExp(seriesFilter, 'i');
    }
    // Populate body with data.items array
    for(var index=0; index < info.items.length; index++){
        var item = info.items[index];
        if((!regexp || filtersOnlySampleSeries && !info.supportsControllersDiscrimination || regexp.test(item.data[seriesIndex]))
                &&
                (!showControllersOnly || !info.supportsControllersDiscrimination || item.isController)){
            if(item.data.length > 0) {
                var newRow = tBody.insertRow(-1);
                for(var col=0; col < item.data.length; col++){
                    var cell = newRow.insertCell(-1);
                    cell.innerHTML = formatter ? formatter(col, item.data[col]) : item.data[col];
                }
            }
        }
    }

    // Add support of columns sort
    table.tablesorter({sortList : defaultSorts});
}

$(document).ready(function() {

    // Customize table sorter default options
    $.extend( $.tablesorter.defaults, {
        theme: 'blue',
        cssInfoBlock: "tablesorter-no-sort",
        widthFixed: true,
        widgets: ['zebra']
    });

    var data = {"OkPercent": 0.0, "KoPercent": 100.0};
    var dataset = [
        {
            "label" : "FAIL",
            "data" : data.KoPercent,
            "color" : "#FF6347"
        },
        {
            "label" : "PASS",
            "data" : data.OkPercent,
            "color" : "#9ACD32"
        }];
    $.plot($("#flot-requests-summary"), dataset, {
        series : {
            pie : {
                show : true,
                radius : 1,
                label : {
                    show : true,
                    radius : 3 / 4,
                    formatter : function(label, series) {
                        return '<div style="font-size:8pt;text-align:center;padding:2px;color:white;">'
                            + label
                            + '<br/>'
                            + Math.round10(series.percent, -2)
                            + '%</div>';
                    },
                    background : {
                        opacity : 0.5,
                        color : '#000'
                    }
                }
            }
        },
        legend : {
            show : true
        }
    });

    // Creates APDEX table
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.0, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [0.0, 500, 1500, "The user creates a new model"], "isController": false}, {"data": [0.0, 500, 1500, "A user arrives at the application"], "isController": false}, {"data": [0.0, 500, 1500, "The user goes back to home page"], "isController": false}, {"data": [0.0, 500, 1500, "The user searches for"], "isController": false}, {"data": [0.0, 500, 1500, "The user opens one of the related models"], "isController": false}, {"data": [0.0, 500, 1500, "The user iterates through page 1"], "isController": false}, {"data": [0.0, 500, 1500, "The user iterates through page 2"], "isController": false}, {"data": [0.0, 500, 1500, "The user iterates through page 3"], "isController": false}, {"data": [0.0, 500, 1500, "The user opens the new model form"], "isController": false}]}, function(index, item){
        switch(index){
            case 0:
                item = item.toFixed(3);
                break;
            case 1:
            case 2:
                item = formatDuration(item);
                break;
        }
        return item;
    }, [[0, 0]], 3);

    // Create statistics table
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 180, 180, 100.0, 1.3555555555555563, 0, 128, 0.0, 1.0, 1.0, 64.81999999999982, 6.347862886161659, 13.811147772958103, 0.0], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["The user creates a new model", 20, 20, 100.0, 0.4, 0, 2, 0.0, 1.0, 1.9499999999999993, 2.0, 0.7072385869373033, 1.5353431433218996, 0.0], "isController": false}, {"data": ["A user arrives at the application", 20, 20, 100.0, 10.450000000000001, 0, 128, 1.0, 47.300000000000054, 124.09999999999994, 128.0, 0.7054176072234764, 1.5619764478696387, 0.0], "isController": false}, {"data": ["The user goes back to home page", 20, 20, 100.0, 0.25, 0, 1, 0.0, 1.0, 1.0, 1.0, 0.706913615156228, 1.5346376625901315, 0.0], "isController": false}, {"data": ["The user searches for", 20, 20, 100.0, 0.3000000000000001, 0, 1, 0.0, 1.0, 1.0, 1.0, 0.7068636460026861, 1.5345291846327842, 0.0], "isController": false}, {"data": ["The user opens one of the related models", 20, 20, 100.0, 0.09999999999999999, 0, 1, 0.0, 0.9000000000000021, 1.0, 1.0, 0.706913615156228, 1.5346376625901315, 0.0], "isController": false}, {"data": ["The user iterates through page 1", 20, 20, 100.0, 0.25, 0, 1, 0.0, 1.0, 1.0, 1.0, 0.7069635913750442, 1.534746155885472, 0.0], "isController": false}, {"data": ["The user iterates through page 2", 20, 20, 100.0, 0.15000000000000002, 0, 1, 0.0, 1.0, 1.0, 1.0, 0.7069885821343985, 1.5348004082859061, 0.0], "isController": false}, {"data": ["The user iterates through page 3", 20, 20, 100.0, 0.049999999999999996, 0, 1, 0.0, 0.0, 0.9499999999999993, 1.0, 0.7071885718326791, 1.5352345656094197, 0.0], "isController": false}, {"data": ["The user opens the new model form", 20, 20, 100.0, 0.25000000000000006, 0, 1, 0.0, 1.0, 1.0, 1.0, 0.7072135785007072, 1.535288852545969, 0.0], "isController": false}]}, function(index, item){
        switch(index){
            // Errors pct
            case 3:
                item = item.toFixed(2) + '%';
                break;
            // Mean
            case 4:
            // Mean
            case 7:
            // Median
            case 8:
            // Percentile 1
            case 9:
            // Percentile 2
            case 10:
            // Percentile 3
            case 11:
            // Throughput
            case 12:
            // Kbytes/s
            case 13:
            // Sent Kbytes/s
                item = item.toFixed(2);
                break;
        }
        return item;
    }, [[0, 0]], 0, summaryTableHeader);

    // Create error table
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": [{"data": ["Non HTTP response code: java.net.UnknownHostException/Non HTTP response message: computer-database.gatling.io: No address associated with hostname", 3, 1.6666666666666667, 1.6666666666666667], "isController": false}, {"data": ["Non HTTP response code: java.net.UnknownHostException/Non HTTP response message: computer-database.gatling.io", 177, 98.33333333333333, 98.33333333333333], "isController": false}]}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 180, 180, "Non HTTP response code: java.net.UnknownHostException/Non HTTP response message: computer-database.gatling.io", 177, "Non HTTP response code: java.net.UnknownHostException/Non HTTP response message: computer-database.gatling.io: No address associated with hostname", 3, "", "", "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": ["The user creates a new model", 20, 20, "Non HTTP response code: java.net.UnknownHostException/Non HTTP response message: computer-database.gatling.io", 20, "", "", "", "", "", "", "", ""], "isController": false}, {"data": ["A user arrives at the application", 20, 20, "Non HTTP response code: java.net.UnknownHostException/Non HTTP response message: computer-database.gatling.io", 17, "Non HTTP response code: java.net.UnknownHostException/Non HTTP response message: computer-database.gatling.io: No address associated with hostname", 3, "", "", "", "", "", ""], "isController": false}, {"data": ["The user goes back to home page", 20, 20, "Non HTTP response code: java.net.UnknownHostException/Non HTTP response message: computer-database.gatling.io", 20, "", "", "", "", "", "", "", ""], "isController": false}, {"data": ["The user searches for", 20, 20, "Non HTTP response code: java.net.UnknownHostException/Non HTTP response message: computer-database.gatling.io", 20, "", "", "", "", "", "", "", ""], "isController": false}, {"data": ["The user opens one of the related models", 20, 20, "Non HTTP response code: java.net.UnknownHostException/Non HTTP response message: computer-database.gatling.io", 20, "", "", "", "", "", "", "", ""], "isController": false}, {"data": ["The user iterates through page 1", 20, 20, "Non HTTP response code: java.net.UnknownHostException/Non HTTP response message: computer-database.gatling.io", 20, "", "", "", "", "", "", "", ""], "isController": false}, {"data": ["The user iterates through page 2", 20, 20, "Non HTTP response code: java.net.UnknownHostException/Non HTTP response message: computer-database.gatling.io", 20, "", "", "", "", "", "", "", ""], "isController": false}, {"data": ["The user iterates through page 3", 20, 20, "Non HTTP response code: java.net.UnknownHostException/Non HTTP response message: computer-database.gatling.io", 20, "", "", "", "", "", "", "", ""], "isController": false}, {"data": ["The user opens the new model form", 20, 20, "Non HTTP response code: java.net.UnknownHostException/Non HTTP response message: computer-database.gatling.io", 20, "", "", "", "", "", "", "", ""], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
