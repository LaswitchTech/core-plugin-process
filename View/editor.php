<article id="layout"></article>
<script>
    (function () {
        $(document).ready(function(){
            builder.Widget('processEditor',"#layout",{data: '<?= $this->Request->getParams('GET', 'id') ?>'});
        });
    })();
</script>
