Ext.define('CustomApp', {
    extend: 'Rally.app.TimeboxScopedApp',
    componentCls: 'app',
    scopeType: 'release',
    comboboxConfig: {
        fieldLabel: 'Select an Release:',
        labelWidth: 100,
        width: 300
    },

    addContent: function() {
		this._showMask("Loading Data");
        this._makeStore();
    },

    _makeStore: function(){
         Ext.create('Rally.data.WsapiDataStore', {
			model:'HierarchicalRequirement',
			autoLoad: true,
			fetch: ['Name','FormattedID','Release','ObjectID','Feature','PortfolioItem','PlanEstimate'],
            filters: [this.getContext().getTimeboxScope().getQueryFilter()],
            listeners: {
                load: function(store,data){
//					console.log(["store",data]);
					this._countPointsByCategory(data);
				},
                scope: this
            }
        }); 
    },

   onScopeChange: function() {
		this._showMask("Loading Data");
        this._makeStore();
    },
	_countPointsByCategory: function(records) {
		var me = this;
		var counts = {};
		var counter = 0;
		var total = 0;
		Ext.Array.each( records, function(record) {
			var category = '';
			var points = record.get('PlanEstimate') || 0;
			if ( record.get('Feature') === null ) {
				category = "Non-Feature";
			} else {
				var PIobject = record.get('Feature');
				category = PIobject.FormattedID;
			}
//			console.log("Record: " + record.get('FormattedID') + ' PI: ' + category);
			if ( ! counts[category] ) { counts[category] = 0; }
			counts[category] += points;
			total += points;
			counter++;
		});
                    
//		console.log(["for ", counter, " records: ", counts]);
		// normalize to percentages
		var count_array = [];
		for ( var category in counts ) {
			if ( counts.hasOwnProperty(category) ) {
				count_array.push({
					name:  category,
					count: counts[category],
					percentage:  100*counts[category]/total
				});
			}
		}
		this._showPie(count_array);
	},
	_showPie:function(count_array){
		var me = this;
		var int_array = [];
		Ext.Array.each(count_array,function(item){
			int_array.push([item.name,item.percentage]);
		});
		var mystore = Ext.create('Rally.data.custom.Store',{
			data: count_array
		});
		if ( this.chart ) { this.chart.destroy(); }
		this.chart = Ext.create('Ext.chart.Chart', {
			minWidth: 400,
			minHeight: 500,
//			html: '<div align="center"><h1>test</h1></div>',
			store: mystore,
			theme: 'Base:gradients',
			series: [{
				type: 'pie',
				allowPointSelect: false,
				angleField: 'percentage',
				showInLegend: true,
				tips: {
					trackMouse: true,
					width: 140,
					height: 50,
					hideDelay: 2000,
					renderer: function(storeItem, item) {
						this.setTitle(storeItem.get('name') + ': ' + 
						Math.round(storeItem.get('percentage'), 3) + 
						'%<br>Story Point Count: ' + storeItem.get('count'));
					}
				},
				label: {
					field: 'name',
					display: 'rotate',
					contrast: true,
					font: '12px Arial'
				}
			}]
		});
		me.add(this.chart);
		this._hideMask();
	},
	_showMask: function(msg) {
		if ( this.getEl() ) { 
			this.getEl().unmask();
			this.getEl().mask(msg);
		}
	},
	_hideMask: function() {
		this.getEl().unmask();
	}

});
