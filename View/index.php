<article id="layout"></article>
<script>
    (function () {
        $(document).ready(function(){
            builder.Layout('index',"#layout",{
                url: '/api/process/fetchAll',
                dblclick: function(event, table, dt, node, data){
                    window.location.href = "/library/process/editor?id=" + data.id + "&name=" + encodeURIComponent(data.category);
                },
                selectTools: false,
                actions: {
                    details:{
                        label:'Details',
                        icon:'eye',
                        action:function(event, table, dt, node, row, data){
                            window.location.href = "/library/process/editor?id=" + data.id + "&name=" + encodeURIComponent(data.category);
                        }
                    },
                },
                buttons: [],
                columns: [
                    {
                        targets: 0,
                        visible: false,
                        title: builder.Locale.get('ID'),
                        name: 'id',
                        data: 'id',
                        defaultContent: '',
                    },
                    {
                        targets: 1,
                        visible: true,
                        className: 'all',
                        responsivePriority: 1,
                        title: builder.Locale.get('Name'),
                        name: 'name',
                        data: 'category',
                        defaultContent: '',
                    },
                    {
                        targets: 2,
                        visible: true,
                        className: 'min-md',
                        width: '75%',
                        responsivePriority: 100,
                        title: builder.Locale.get('Description'),
                        name: 'description',
                        data: 'description',
                        defaultContent: '',
                    },
                    {
                        targets: 3,
                        visible: false,
                        className: 'min-md',
                        responsivePriority: 1000,
                        title: builder.Locale.get('Table'),
                        name: 'targetTable',
                        data: 'targetTable',
                        defaultContent: '',
                    },
                ],
            });
        });
    })();
</script>
