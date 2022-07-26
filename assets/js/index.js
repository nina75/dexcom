$(function () {
    
    (function() {
      getLatest();
    })();
    
    const uri = route('sts', 'egvs');
    const formEgvs = $('#form-egvs');
    const spinner = $('#spinner-html').html();
    const templateCanvas = $('#template-canvas').html();
    const low = 4;
    const high = 10;
    const dateFormat = 'YYYY-MM-DDTHH:mm:ssZ';
    const snooze = {
      val: 0,
      dateTime: moment().format(dateFormat),
    };
    const lsTitle = 'dexBotz';
    const arrows = {
      'Flat': '\u2192',
      'FortyFiveUp': '\u279A',
      'SingleUp': '\u2191',
      'DoubleUp': '\u21C8',
      'FortyFiveDown': '\u2798',
      'SingleDown': '\u2193',
      'DoubleDown': '\u21CA'
    };
    const alarmFrequency = 5;//minutes
    
    
    $('#dp-start-date').datetimepicker({
      locale: 'bg',
      format: 'DD.MM.YYYY HH:mm:ss',
      defaultDate: moment(new Date(), 'DD.MM.YYYY HH:mm:ss').subtract(7,'d'),
    });
    
    $('#dp-end-date').datetimepicker({
      locale: 'bg',
      format: 'DD.MM.YYYY HH:mm:ss',
      defaultDate: new Date(),
    });
    
    $('#dp-start-date,#dp-end-date').on('change.datetimepicker', function(e) {
      
      $('input', e.currentTarget).blur().removeAttr('readonly', 'readonly');
    });
    
    $('[name=startDate],[name=endDate]').on('focus', function(e) {
      
      if ( $('.bootstrap-datetimepicker-widget').length > 0 ) {
        
        $(e.currentTarget).attr('readonly', 'readonly');
      }
    });
    
    $('[name=startDate],[name=endDate]').on('focusout', function(e) {
      $(e.currentTarget).removeAttr('readonly');
    });
    
        
    $('.js-btn-fetch-egvs', formEgvs).on('click', function (e) {
      e.preventDefault();
      
      $(e.currentTarget).html(spinner);
      
      let startDate = moment( $('[name=startDate]', formEgvs).val(), 'DD.MM.YYYY HH:mm:ss', true ).format('YYYY-MM-DD\TH:m:s');
      let utcStartDate = moment(startDate, 'YYYY-MM-DD\THH:mm:ss').utc().format('YYYY-MM-DD\THH:mm:ss');
      
      let endDate = moment( $('[name=endDate]', formEgvs).val(), 'DD.MM.YYYY HH:mm:ss', true ).format('YYYY-MM-DD\TH:m:s');
      let utcEndDate = moment(endDate, 'YYYY-MM-DD\THH:mm:ss').utc().format('YYYY-MM-DD\THH:mm:ss');
      
      getEgvs( uri, {startDate: utcStartDate, endDate: utcEndDate, user_id: User.getDora()} );

    });
    
    
    $('.js-btn-units').on('click', function(e) {
      e.preventDefault();
      
      $('.js-btn-units').removeClass('btn-success');
      
      $(e.currentTarget).addClass('btn-success');
      
      $('.units').addClass('d-none');
      $('.js-average-egvs').addClass('d-none');
      
      
      $( '.js-latest-' + e.currentTarget.dataset.unit ).closest('.units').removeClass('d-none');
      
      $( '.js-average-egvs-' + e.currentTarget.dataset.unit ).closest('.js-average-egvs').removeClass('d-none');
      
      $('div[class^=js-chart-container]').addClass('d-none');
      
      $( '.js-chart-container-' + e.currentTarget.dataset.unit ).removeClass('d-none');
      
    });
    
    
    $('#btn-reload-latest').on('click', function() {
      
      $('p[class*="js-latest"]').html(spinner);
      
      getLatest();
      
    });

    const $modalAlerts = $('#modalSetUpAlerts');
    $modalAlerts.on('show.bs.modal', function() {
      const ls = localStorage.getItem(lsTitle);
      const dexBotz = JSON.parse(ls) || {};
      const $low = $('#sgv-low');
      const $high = $('#sgv-high');
      const $snooze = $('#snoozeAlert');
      const snoozeVal = dexBotz?.snoozeAlert.val || snooze.val;
      const $snoozedTo = $('#snoozed-to');

      $low.val(dexBotz?.low || low);
      $high.val(dexBotz?.high || high);
      $snooze.val(snoozeVal);
      $snoozedTo.text('');

      if (snoozeVal > 0 && snoozeVal < 100) {
        const snoozedTo = moment(dexBotz.snoozeAlert.dateTime, dateFormat).format('HH:mm')
        $snoozedTo.text('Snoozed to ' + snoozedTo)
      }
    });

    $('#btn-save-alerts').on('click', function() {
      let ls = localStorage.getItem(lsTitle);
      let dexBotz = JSON.parse(ls) || {};
      const snoozeVal = $('#snoozeAlert').val() || snooze.val;
      let dateTime = moment().format(dateFormat);

      if (snoozeVal > 0 && snoozeVal < 100) {
        const mins = snoozeVal * 60;
        dateTime = moment().add(mins, 'm').format(dateFormat)
      }

      dexBotz.low = $('#sgv-low').val() || low;
      dexBotz.high = $('#sgv-high').val() || high;
      dexBotz.snoozeAlert = {
        val: snoozeVal,
        dateTime: dateTime
      };

      ls = JSON.stringify(dexBotz);
      localStorage.setItem(lsTitle, ls);
    });

    function notifyMe(sgvData = {}) {
      if (!("Notification" in window)) {
        alert("This browser does not support desktop notification");
      } else if (Notification.permission === "granted") {
        showNotification(sgvData);
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(function (permission) {
          if (permission === "granted") {
            showNotification(sgvData);
          }
        });
      }
    }

    Notification.requestPermission().then(function (permission) {
      console.log('Notifications: ' + permission);
    });
    
    function showNotification(sgvData = {}) {
      const mmol = sgvData.sgv / 18;
      let ls = localStorage.getItem(lsTitle);
      const dexBotz = JSON.parse(ls) || {};
      const lowAlert = dexBotz?.low || low;
      const highAlert = dexBotz?.high || high;
      const snoozeAlert = dexBotz.snoozeAlert || $.extend({}, snooze);
      const currentTime = moment().format(dateFormat);

      if (snoozeAlert.val > 0) {

        if (snoozeAlert.val > 100 || moment(currentTime, dateFormat).isBefore(snoozeAlert.dateTime)) {

          return;
        }

        dexBotz.snoozeAlert.val = 0;
        ls = JSON.stringify(dexBotz);
        localStorage.setItem(lsTitle, ls);
      }

      if (mmol < lowAlert || mmol > highAlert) {
        const title = mmol > highAlert ? 'High alert!' : 'Low alert';
        const localTime = moment.utc(sgvData.dateString, dateFormat).local().format('HH:mm');
        const arrow = arrows[sgvData.direction] || sgvData.direction;
        mmolData = mmol.toFixed(1) + ' ' + arrow + ' ' + localTime;
        let notification = new Notification(title, {
          requireInteraction: true,
          body: mmolData
        });
        notification.onclick = function(x) { window.focus(); };
      }
    }
    
    function getLatest() {
      
      $.ajax({
        type: "GET",
        url: route('sts', 'latest'),
        data: {user_id: User.getDora()},
        cache: false,
      }).done(function (response) {
        
        const mmolCont = $('.js-latest-mmol');
        const mgCont = $('.js-latest-mg');
        
        if(response.success) {
          const sgvData = response.data[0] || {};
          let mmolData = 'No Data';
          let mgData = 'No Data';

          setTimeout(getLatest, alarmFrequency * 60000);

          if (sgvData.sgv) {
            const localTime = moment.utc(sgvData.dateString, dateFormat).local().format('HH:mm');
            const mmol = sgvData.sgv / 18;
            const arrow = arrows[sgvData.direction] || sgvData.direction;

            mmolData = mmol.toFixed(1) + ' ' + arrow + ' ' + localTime;
            mgData = sgvData.sgv + ' ' + arrow + ' ' + localTime;

            document.title = mmolData;
          }

          mmolCont.html(mmolData);
          mgCont.html(mgData);

          notifyMe(sgvData);
        }
      });
    }
    
    function getEgvs(url, data) {

      let chartConfig = {
        //The type of chart we want to create
        type: 'line',

         //The data for our dataset
        data: {
            labels: [],
            datasets: [],
        },

         //Configuration options goes here
        options: {
          responsive: true,
          legend: {
            display: false,
          },
          scales: {
            yAxes: [{
              ticks: {
                min: 0,
                callback: function(value, index, values) {
                  if (Math.floor(value) === value) {
                      return value;
                  }
                }
              }
            }]
          }
        }
      };
      
      let datasets = {
        egvs: {
          label: 'EGVS',
          fill: false,
          borderColor: 'rgb(0, 0, 0)',
          backgroundColor: 'rgb(0, 0, 0)',
          data: [],
        }, 
        high: {
          label: 'High',
          fill: true,
          backgroundColor: 'rgba(128, 255, 128, 0.3)',
          borderColor: 'rgba(255, 0, 0, 0.5)',
          data: [],
          pointRadius: 0,
        }, 
        low: {
          label: 'Low',
          borderColor: 'rgb(255, 0, 0)',
          backgroundColor: 'rgba(255, 0, 0, 0.5)',
          data: [],
          pointRadius: 0,
        }
      };
      
      let mgDatasets = $.extend(true, {}, datasets);


      $.ajax({
        type: "GET",
        url: url,
        data: data,
        cache: false,
      }).done(function (response) {

        if(response.success) {

          const egvs = response.data;
          let average = 0;
          let dataValue = {};

          for (let i = egvs.length - 1; i >= 0; i--) {
            
            if (!Number.isInteger(egvs[i]['sgv'])) {
              continue;
            }

            let cDay = moment(egvs[i]['dateString'], dateFormat).format('DD.MM');
            
            if ( dataValue[cDay] ) {
              dataValue[cDay]['sgv'] += egvs[i]['sgv'];
              dataValue[cDay]['len']++;
            } else {
              dataValue[cDay] = {};
              dataValue[cDay]['sgv'] = egvs[i]['sgv'];
              dataValue[cDay]['len'] = 1;
              
              chartConfig.data.labels.push(cDay);
              
              datasets.high.data.push(10);
              datasets.low.data.push(3);
              
              mgDatasets.high.data.push(180);
              mgDatasets.low.data.push(50);
            }
            
            average += egvs[i]['sgv'];
          }
          
          
          let mgChartConfig = $.extend(true, {}, chartConfig);
          
          
          chartConfig.data.labels.forEach(function(label) {
            let mg = dataValue[label]['sgv']/dataValue[label]['len'];
            
            datasets.egvs.data.push( Number.parseFloat(mg/18).toFixed(1) );
            mgDatasets.egvs.data.push( Math.round(mg) );
          });
          
          Object.keys(datasets).forEach(function(key) {
            
            chartConfig.data.datasets.push(datasets[key]);
            mgChartConfig.data.datasets.push(mgDatasets[key]);
          });
          
          let averageEgvs = average / egvs.length;

          $('.js-average-egvs-mmol').html( Number.parseFloat(averageEgvs/18).toFixed(1) );
          $('.js-average-egvs-mg').html( Math.round(averageEgvs) );
          $('.js-average-egvs-container').removeClass('d-none');
          
          $('.js-btn-fetch-egvs', formEgvs).html('Fetch');
          
          
          $('.js-chart-container-mmol').html( templateCanvas.replace('#canvasId#', 'mmolChart') );
          $('.js-chart-container-mg').html( templateCanvas.replace('#canvasId#', 'mgChart') );
          
          
          const mmolChart = document.getElementById('mmolChart').getContext('2d');
          const mgChart = document.getElementById('mgChart').getContext('2d');
          
          
          const chart = new Chart(mmolChart, chartConfig);
          const mgLChart = new Chart(mgChart, mgChartConfig);
          
        }
      }).fail(function (error) {
        console.log(error);
      });
    }
});
