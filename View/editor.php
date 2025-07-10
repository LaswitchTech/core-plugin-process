<div class="col-12" id="layout"></div>
<script>
    $(document).ready(function(){
        $.ajax({
            url: '/api/process/fetch?id=<?= $this->Request->getParams('GET', 'id') ?>',
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

                // Configure Storage
                builder.Storage.setKey('process:'+response.record.id);
                builder.Storage.set(response);
                console.log(builder.Storage.get())

                // Layout
                let Layout = $(document.createElement('div')).addClass('row g-3').appendTo('#layout');
                Layout.details = $(document.createElement('div')).addClass('col-12').appendTo(Layout);
                Layout.process = $(document.createElement('div')).addClass('col-12').appendTo(Layout);

                // Details
                const Details = builder.Component(
                    "card",
                    Layout.details,
                    {
                        icon: "card-text",
                        title: builder.Locale.get("Details"),
                    },
                    function(card,component){

                        // Remove card-body
                        component.body.removeClass('card-body');

                        // Create a table to display the details
                        ProcessDetails(builder.Storage.get('record'),component.body);
                    },
                );

                // Process
                const Process = builder.Component(
                    "card",
                    Layout.process,
                    {
                        icon: "bar-chart-steps",
                        title: builder.Locale.get("Process"),
                        hideFooter: false,
                    },
                    function(card,component){

                        // Remove card-body
                        component.body.removeClass('card-body');

                        // Create a table to display the details
                        ProcessEditor(builder.Storage.get('record'),component.body);
                    },
                );
            },
        });
    });
</script>
