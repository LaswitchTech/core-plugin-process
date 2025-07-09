<div class="col-12" id="layout"></div>
<script>
    $(document).ready(function(){
        $.ajax({
            url: '/api/process/index',
            type: 'GET',dataType: 'json',
            error: function(xhr, status, error) {
                let color = 'info', icon = 'question-circle', title = builder.Locale.get(xhr.statusText), content = builder.Locale.get(xhr.responseText);
                switch(xhr.status){
                    case 403: color = 'danger'; icon = 'person'; break;
                    case 404: color = 'warning'; icon = 'question-diamond'; break;
                    case 500: color = 'danger'; icon = 'bug'; break;
                }
                builder.Component("alert","#layout",{icon:icon,color:color,title:title},function(alert,component){component.content.html('<pre class="m-0 p-2">'+content+'</pre>');});
            },
            success: function(response) {

                // Set Actions
                var actions = {
                    details:{
                        label: builder.Locale.get('Details'),
                        icon:'eye',
                        action:function(event, table, dt, node, row, data){
                            window.location.href = '/plugin/process/editor?id='+data.id+'&name='+data.category;
                        }
                    },
                };

                // Set Buttons
                var buttons = [
                    {
                        className : 'btn-success',
                        init: function (dt, node){
                            $(node).removeClass('btn-secondary');
                        },
                        text: '<i class="bi bi-plus-lg me-2"></i>'+builder.Locale.get('Create'),
                        action:function(e, dt, node, config){
                            ProcessModalCreate(dt);
                        },
                    },
                ];

                // Layout
                builder.Layout(
                    "list",
                    "#layout",
                    {
                        title: builder.Locale.get('Processses'),
                        icon: 'bar-chart-steps',
                        advancedSearch:true,
                        exportTools:true,
                        columnsVisibility:true,
                        selectTools:true,
                        showButtonsLabel: false,
                        dblclick:function(event, table, dt, node, data){
                            actions.details.action(event, table, dt, node, null, data);
                        },
                        actions:actions,
                        buttons:buttons,
                        columnDefs:[
                            { target: 0, visible: false, title: builder.Locale.get('ID'), name: 'id', data: 'id', render: function(data, type, row) {
                                var object = $(document.createElement('span'))
                                    .addClass('my-2')
                                    .text(data)
                                return object.prop('outerHTML');
                            }},
                            { target: 1, visible: true, title: builder.Locale.get('Name'), name: 'category', data: 'category', render: function(data, type, row) {
                                var object = $(document.createElement('span'))
                                    .addClass('my-2')
                                    .text(data)
                                return object.prop('outerHTML');
                            }},
                            { target: 2, visible: true, title: builder.Locale.get('Description'), name: 'description', data: 'description', width: '75%', render: function(data, type, row) {
                                var object = $(document.createElement('span'))
                                    .addClass('my-2')
                                    .text(data)
                                return object.prop('outerHTML');
                            }},
                            { target: 3, visible: false, title: builder.Locale.get('Table'), name: 'targetTable', data: 'targetTable', render: function(data, type, row) {
                                var object = $(document.createElement('span'))
                                    .addClass('my-2')
                                    .text(data)
                                return object.prop('outerHTML');
                            }},
                        ],
                    },
                    function(layout, component){

                        // Set container
                        var container = component.card._component.body;

                        // Lower the z-index of the table
                        component.table._component.table.addClass('z-2');

                        // Add Records to Layout
                        for(const [key, record] of Object.entries(response)){
                            layout.add(record);
                        }
                    },
                );
            },
        });
    });
</script>
