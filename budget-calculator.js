var budget_calculator = (function($){
	//Set the default incomes and outgoings here
	var defaultsObj = {
		'income':{/*
			1:{name:"Your take home pay",freq:52,value:0},
			2:{name:"Partners take home pay",freq:4,value:0},
			3:{name:"Bonuses/overtime",freq:26,value:0},
			4:{name:"Income from savings and investments",freq:1,value:0},
			5:{name:"Child support received ",freq:12,value:0}*/
		},'outgoings':{/*
			1:{name:"Electricity",freq:4,value:0},
			2:{name:"Gas",freq:4,value:0},
			3:{name:"Water",freq:4,value:0},
			4:{name:"Internet",freq:4,value:0},
			5:{name:"Telephone",freq:4,value:0},
			6:{name:"Car Insurance",freq:1,value:0}*/
		}
	};		
	//Functions to store and retrieve objects from localstorage
	function ls_store(name,o){
		localStorage.setItem(name, JSON.stringify(o));			
	};
	function ls_read(name){
		return JSON.parse(localStorage.getItem(name));
	};
	//Format a currency string
	function format_currency(num) {
		var p = num.toFixed(0).split(".");
		return "$" + p[0].split("").reverse().reduce(function(acc, num, i, orig) {
			return  num + (i && !(i % 3) && !(num=='-') ? "," : "") + acc;
		}, "");
	}	

	function set_defaults(){
		ls_store('bc_expenses',defaultsObj);
		expensesObj = ls_read('bc_expenses'); 
	}
	//If our localstroage items are empty let's store the defaults
	if(ls_read('bc_expenses')==null){
		set_defaults();
	}
	var expensesObj = ls_read('bc_expenses'); 
	//Reset the localstorage if the clear link is clicked
	$('.reset-localstorage').click(function(e) {
		e.preventDefault();
        set_defaults();
		display_tables();
    });	
	//Set our frequencies object
	var frequenciesObj = {52:"שבועי", 26:"דו-שבועי", 12:"חודשי", 4:"רבעוני", 1:"שנתי"}; 
	function display_percents(element_class, value, percent){
		$('#totals '+element_class+' > h3 > span').html(format_currency(value));
		$('#totals '+element_class+' .progress-bar').html('<span class="percent">' + percent.toFixed(2)+'%</span>')
		if(percent<0){
			$('#totals '+element_class+' .progress-bar').css('width',(percent*-1)+'%').addClass('progress-bar-danger');
		}else{
			$('#totals '+element_class+' .progress-bar').css('width',percent+'%').removeClass('progress-bar-danger');	
		}
	}
	function calc_totals(){
		var income_total = 0;
		var outgoings_total = 0;
		for(var i in expensesObj['income']){
			var e = expensesObj['income'][i];
			income_total = income_total+e.value * e.freq;
		}
		for(var i in expensesObj['outgoings']){
			var e = expensesObj['outgoings'][i];
			outgoings_total = outgoings_total+e.value * e.freq;
		}	
		var outgoings_percent = (outgoings_total/income_total)*100;
		var income_percent = 100-outgoings_percent;
		var savings_total = parseInt(income_total - outgoings_total,10);
		var savings_percentage = (savings_total/income_total)*100;
		display_percents('.total-income', income_total, income_percent);if(isNaN(income_percent)){display_percents('.total-income', 0, 0)}
		display_percents('.total-outgoings', outgoings_total, outgoings_percent);if(isNaN(outgoings_percent)){display_percents('.total-outgoings', 0, 0)}
		display_percents('.total-savings', savings_total, savings_percentage);if(isNaN(savings_percentage)){display_percents('.total-savings', 0, 0)}
	}
	//Function to calculate the incomes or outgoings
	function calc_costs(){
		for(var type in expensesObj){
			var total = 0;
			$('.budget-calculator #'+type+' tbody tr').each(function() {
				var amount = $(this).find('.amount').val();
				var freq = $(this).find('.freq').val();
				var single_total = amount*freq;
				var row_id = $(this).attr('data-id');
				if(!isNaN(single_total)){
					total = total + single_total;
					$('#'+type+' tbody tr[data-id="'+row_id+'"]').find('.single-total').html(''+format_currency(single_total));
					if(type == "income"){
						$('#'+type+' tfoot .total').html('סכום הכנסות שנתיות כולל: '+format_currency(total));
					}
					else{
						$('#'+type+' tfoot .total').html('סכום הוצאות שנתיות כולל: '+format_currency(total));
					}
				
					expensesObj[type][row_id].value=amount;
					expensesObj[type][row_id].freq=freq;
					ls_store('bc_expenses',expensesObj)
				}
			});
		}
		calc_totals();
	}
	//Display the incomes/outgoings objects as a table
	function display_tables(){
		for(var type in expensesObj){
			var d = '';
			for(var i in expensesObj[type]){
				d+='<tr data-id="'+i+'" data-type="'+type+'">'+
				'<td>'+expensesObj[type][i].name+':</td>'+
				'<td><select class="freq">';
				for(var f in frequenciesObj){
					var selected = '';
					if(expensesObj[type][i].freq == f){selected = ' selected';}
					d+='<option value="'+f+'" '+selected+'>'+frequenciesObj[f]+'</option>';
				}
				d+='</select></td>'+
				'<td><input class="amount" type="text" maxlength="8" value="'+expensesObj[type][i].value+'"/></td>'+
				'<td><span class="single-total">$0</span></td>'+
				'<td><span class="remove-row"><i class="glyphicon glyphicon-trash"></i></span></td>'+
				'</tr>';
			}
			$('.budget-calculator #'+type+' tbody').html(d);		
		}
		calc_costs();		
	}
	$('.nav-tabs a').click(function (e) {
	  e.preventDefault()
	  $(this).tab('show')
	})
	//text value get's changed
	$('.budget-calculator').on('keyup','tbody .amount',function(e) {
		var type= $(this).closest('.tab-pane').attr('id')
		calc_costs()
    });
	//Frequency gets changed
	$('.budget-calculator').on('change','tbody .freq',function(e) {
		var type= $(this).closest('.tab-pane').attr('id')
		calc_costs()
    });
	//Add a row button get's clicked - launch the bootstrap modal
	$('.budget-calculator').on('click','.add-row',function(e) {
		var type= $(this).attr('data-type');
		$('#budget-calculator-add-row .btn-add-row').attr('data-type',type)
		if(type == "income"){
			$('#budget-calculator-add-row label').text('הכנס שם עבור הכנסות');
		}
		else{
			$('#budget-calculator-add-row label').text('הכנס שם עבור הוצאות')
		}
		$('#budget-calculator-add-row').modal();
	});
	//Add a new row
	$('#budget-calculator-add-row .btn-add-row').click(function(e) {
		var val = $('#add-row-name').val();
		var type= $(this).attr('data-type');
       if(val.length>0){
		   //Lets add the row
		   for(var i in expensesObj[type]){
			   var new_index = parseInt(i,10)+1;
		   }
		   expensesObj[type][new_index] = {name:val,freq:12,value:0}
		   ls_store('bc_expenses',expensesObj);//Store the object
		   display_tables();
		   calc_costs();
		   $('#add-row-name').val('')
		   $('#budget-calculator-add-row').modal('hide');
		}else{
			console.info('No value Entered so will not save!');
		}
    });
	//Remove a row
	$('.budget-calculator').on('click','.remove-row',function(e) {
		var type= $(this).closest('tr').attr('data-type');
		var id= $(this).closest('tr').attr('data-id');
		delete expensesObj[type][id];
		ls_store('bc_expenses',expensesObj);//Store the object
		display_tables();
		calc_costs();		
	})
	//Display the objects as HTML in the forms
	display_tables()	
})(jQuery);