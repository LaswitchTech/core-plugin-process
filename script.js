//
//   Core Framework - Script file
//
//   @license    MIT (https://mit-license.org/)
//   @author     Louis Ouellet <louis@laswitchtech.com>
//

// Create a Process Tree
const ProcessTree = function(taskRecord, groupContainer = null, listContainer = null){

    // Initialize variables
    var current = 1;
    var active = 0;
    var process = taskRecord.process;

    // Create the container(s)
    var container = $(document.createElement('div'));
    container.group = $(document.createElement('div')).addClass('btn-group w-100 rounded-0').appendTo(groupContainer || container);
    container.list = $(document.createElement('div')).appendTo(listContainer || container);

    // Create the list
    builder.Component(
        "list",
        container.list,
        {
            class: {
                component: "bg-transparent",
            },
            tools: {},
            actions: {},
            icon: "square",
        },
        function(list,component){

            // Save the component
            container.list.component = component;

            // Add extra classes
            component.addClass('px-2 py-1 border-0');

            // Loop through the process
            for(const [order, step] of Object.entries(process)){

                // Update the current step
                if(step.isCompleted){
                    current = (parseInt(order) + 1);
                }
                if(current > Object.entries(process).length){
                    current = Object.entries(process).length;
                }

                // Create the button
                var button = $(document.createElement('button'))
                    .attr({
                        "type": "button",
                        "class": "btn btn-outline-secondary rounded-0",
                        "data-order": order,
                        "data-bs-toggle": "tooltip",
                        "data-bs-placement": "top",
                        "title": step.description,
                        "data-bs-title": step.description,
                    })
                    .text(step.name)
                    .appendTo(container.group);

                // Initialize the tooltip
                new bootstrap.Tooltip(button);

                // Add the click event
                button.click(function(){

                    // Mark all buttons as not active
                    container.group.find('button').removeClass('active');

                    // Mark the active button as active
                    $(this).addClass('active');

                    // Update the active
                    active = parseInt($(this).attr('data-order'));

                    // Render the list
                    render();
                });

                // Loop through the tasks
                for(const [taskOrder, task] of Object.entries(step.tasks)){

                    // Add the task to the list
                    list.add(
                        {
                            field: builder.Locale.get(task.name),
                            click: null,
                        },
                        function(item){

                            // Add extra classes
                            item.addClass('rounded border-0 my-1');

                            // Add Attributes
                            item.attr({
                                "data-order": order,
                                "data-task": taskOrder,
                                "data-bs-toggle": "tooltip",
                                "data-bs-placement": "left",
                                "title": task.description,
                                "data-bs-title": task.description,
                            });

                            // Initialize the tooltip
                            new bootstrap.Tooltip(item);

                            // Hide the item
                            item.hide();
                        },
                    );
                }

                // Initial Render
                renderGroup();

                // trigger the click event
                container.group.find('button[data-order="'+current+'"]').trigger('click');
            }
        },
    );

    container.render = function(){
        render();
    }

    // Rendering functions
    function renderGroup(){

        // Loop through the buttons
        container.group.find('button').each(function(){

            // Get the button
            var button = $(this);

            // Get the order
            var order = parseInt(button.attr('data-order'));

            // Update the button
            button.removeClass('btn-success btn-light btn-outline-secondary');
            if(order < current){
                button.addClass('btn-success');
            } else if(order === current){
                button.addClass('btn-light');
            } else {
                button.addClass('btn-outline-secondary');
            }
        });
    }
    function render(){

        // Get the items
        var items = container.list.component.find('li');

        // Hide all the items
        items.hide();

        // Loop through the items
        items.each(function(){

            // Get the item
            var item = $(this);

            // Get the order
            var order = parseInt(item.attr('data-order'));

            // Show the item
            if(order == active){
                item.show();
            }

            // Get the task
            var task = parseInt(item.attr('data-task'));

            // Get background color
            var color = (process[order].tasks[task].isDisabled) ? '' : 'text-bg-light';
            color = (process[order].tasks[task].isCompleted) ? 'text-bg-success' : color;

            // Get icon
            var icon = (process[order].tasks[task].isCompleted) ? 'check-square' : 'square';

            // Get cursor
            var cursor = (process[order].tasks[task].isDisabled) ? 'cursor-not-allowed' : 'cursor-pointer';
            cursor = (process[order].tasks[task].isCompleted) ? '' : cursor;

            // Set the icon
            item.find('i').removeClass('bi-square bi-check-square').addClass('bi-'+icon);

            // Remove any background color and cursor
            item.removeClass('text-bg-light text-bg-success cursor-not-allowed cursor-pointer');

            // Set background color and cursor
            item.addClass(color).addClass(cursor);

            // on hover Add bg-secondary to the item
            item.off('hover').hover(
                function(){

                    // Check if the task is disabled
                    if(!process[order].tasks[task].isDisabled){

                        // Get background color
                        color = (process[order].tasks[task].isDisabled) ? '' : 'text-bg-light';
                        color = (process[order].tasks[task].isCompleted) ? 'text-bg-success' : color;

                        // Update the item background color
                        item.removeClass(color).addClass('text-bg-secondary');
                    }
                },
                function(){

                    // Update the item background color
                    if(!process[order].tasks[task].isDisabled){

                        // Get background color
                        color = (process[order].tasks[task].isDisabled) ? '' : 'text-bg-light';
                        color = (process[order].tasks[task].isCompleted) ? 'text-bg-success' : color;

                        // Update the item background color
                        item.addClass(color).removeClass('text-bg-secondary');
                    }
                },
            );

            // Check if the task is disabled
            if(process[order].tasks[task].isDisabled){
                complete(order, task);
            } else {
                item.off('click').click(function(){
                    complete(order, task);
                });
            }
        });
    }

    // Function to call a function by name
    function call(name, ...args) {

        // Split the name into parts
        let parts = name.split(".");

        // Count the number of parts (should be at least 1)
        if(parts.length > 0) {

            // Check if the first part is a global
            if(typeof window[parts[0]] !== "undefined") {

                // Check if the first part is a global function
                if(typeof window[parts[0]] === "function" || typeof window[parts[0]] === "object") {

                    // Get the function from the global scope
                    let func = window[parts[0]];

                    // Check if the function is a method of an object
                    if(parts.length > 1) {

                        // Get the object from the global scope
                        let obj = window[parts[0]];

                        // Traverse the parts to get the object
                        for(let i = 1; i < parts.length - 1; i++) {

                            // Replace the object with the property
                            obj = obj[parts[i]];
                        }

                        // Get the method from the object
                        func = obj[parts[parts.length - 1]];
                    }

                    // Call the function with the arguments
                    func(...args);
                } else {
                    console.error("Invalid type: " + typeof window[parts[0]]);
                }
            } else {
                if(typeof globalThis[parts[0]] !== "undefined"){
                    console.log(globalThis[parts[0]]);
                } else {
                    console.error("Invalid type: " + typeof window[parts[0]]);
                }
            }
        } else {
            console.error("Function not found: " + name);
        }
    }

    // Function to attempt to complete a task
    function complete(order, task){

        // Check if the prior tasks are completed
        if(task > 1 && !process[order].tasks[task - 1].isCompleted){
            return;
        } else {
            if(order > 1 && !process[order - 1].isCompleted){
                return;
            }
        }

        // Check if the task is already completed
        if(process[order].tasks[task].isCompleted){
            return;
        }

        // Check if an onComplete function is defined
        if(typeof process[order].tasks[task].onComplete === "string"){

            // Call the call function with the name and taskRecord
            call(process[order].tasks[task].onComplete, taskRecord, process[order].tasks[task].value, function(response){

                mark(order, task);
            });
        } else {

            mark(order, task);
        }
    }

    // Function to mark the task
    function mark(order, task){

        // Check if the task is already completed
        if(!process[order].tasks[task].isCompleted){

            // Update the task
            process[order].tasks[task].isCompleted = true;

            // Check if the process is completed
            if(typeof process[order].tasks[task + 1] === "undefined"){

                // Update the process
                process[order].isCompleted = true;

                // Check if another process is available
                if(typeof process[order + 1] !== "undefined"){

                    // Update the current step
                    current = order + 1;

                    // trigger the click event
                    container.group.find('button[data-order="'+current+'"]').trigger('click');

                    // Update any status badge
                    var badges = $('span.badge[data-type="status"][data-task="'+taskRecord.id+'"]');
                    badges.each(function(){
                        var badge = $(this);

                        // Remove any classes starting with text-bg-
                        badge.removeClass(function(index, className) {
                            return (className.match(/(^|\s)text-bg-\S+/g) || []).join(' ');
                        });

                        // Set the new background color
                        badge.addClass('text-bg-'+process[order + 1].color);

                        // Clear the content of the badge
                        badge.html('');

                        // Add the new label
                        badge.text(builder.Locale.get(process[order + 1].name));

                        // Insert the new icon
                        var icon = $(document.createElement('i')).addClass('me-1 bi bi-'+process[order + 1].icon).prependTo(badge);
                    });
                }

                // Render the button group
                renderGroup();
            }

            // Save the updated process
            save();
        }
    }

    // Function to save the process tree
    function save(){
        let data = {
            process: process,
        };
        data[CSRF_KEY] = CSRF_TOKEN;
        $.ajax({
            url: '/endpoint.php/tasks/process?id=' + taskRecord.id,
            type: 'POST',dataType: 'json',
            data: data,
            success: function(response) {

                // Render the list
                render();
            },
        });
    }

    // Return the container
    return container;
}
// Retrieve the process functions
const ProcessFunctions = function(){
    var functions = {};
    const processFunctions = Object.keys(window).filter(k => typeof window[k] === 'function' && k.startsWith('process_function_'));
    for(const [key, name] of Object.entries(processFunctions)){
        // Check if the meta function exists
        if(typeof window[name.replace('process_function_', 'process_meta_')] === 'function'){
            // Get the meta function
            const metaFunction = window[name.replace('process_function_', 'process_meta_')];
            // Get the metadata
            var metadata = metaFunction();
            // Set invalid to false
            var invalid = false;
            // Set default values
            metadata.placeholder = metadata.type == "select" ? "Select an option" : (metadata.type == "text" ? "Type a Value" : null);
            metadata.value = metadata.value ?? null;
            metadata.options = metadata.options ?? [];
            // Check if all the required fields are present
            for(const [k, required] of Object.entries(['label', 'description', 'type', 'placeholder', 'value', 'options'])){
                if(typeof metadata[required] === 'undefined'){
                    console.error("Invalid widget["+name+"] metadata: "+required);
                    invalid = true;
                    break;
                }
            }
            if(invalid){
                continue;
            }
            // Add the widget to the list
            functions[name] = metadata;
        }
    }
    return functions;
}
// Create the Process Details
const ProcessDetails = function(process, container){

    // Create the details container
    var details = $(document.createElement('div')).appendTo(container);

    // Create Table
    details.table = $(document.createElement('table')).addClass('table table-striped m-0 rounded-bottom').appendTo(details);
    details.table.body = $(document.createElement('tbody')).appendTo(details.table);

    // Function to edit the process
    details.edit = function(){

        // AJAX Request
        $.ajax({
            url: '/endpoint.php/process/meta',
            type: 'GET',dataType: 'json',
            success: function(response) {

                // Create a modal
                builder.Component(
                    "modal",
                    {
                        callback: {
                            submit: function(element,modal){
                                element.form.submit();
                            },
                        },
                        icon: "pencil-square",
                        title: "Edit Process's Details",
                        size: 'xl',
                    },
                    function(modal,component){

                        // Save Modal Component for select2 fields
                        const componentModal = component;

                        // Styling
                        component.header.addClass('text-bg-warning');
                        component.footer.submit.text('Apply changes').addClass('btn-success').removeClass('btn-link');
                        component.footer.submit.icon = $(document.createElement('i')).addClass('bi bi-check-circle me-1').prependTo(component.footer.submit);

                        // Create Form
                        component.form = builder.Component(
                            'form',
                            component.body,
                            {
                                class:{
                                    form: 'row g-3',
                                    field: 'col-12',
                                },
                                callback:{
                                    submit: function(form){

                                        // AJAX Request
                                        $.ajax({
                                            url: '/endpoint.php/process/update?id=' + process.id,
                                            headers: {'X-CSRF-Authorization': CSRF_KEY},
                                            type: 'POST',dataType: 'json',
                                            data: form.val(),
                                            success: function(response) {

                                                // Update CSRF Token
                                                CSRF_KEY = response.CSRF.key;
                                                CSRF_TOKEN = response.CSRF.token;

                                                // Loop through the process to update the details
                                                for(const [key, value] of Object.entries(response.record)){

                                                    // Set value to Process
                                                    process[key] = value;

                                                    // Update the table
                                                    if(typeof details.rows[key] !== 'undefined'){
                                                        details.rows[key].value = value;
                                                        details.rows[key].td.text(value);
                                                    }
                                                }

                                                // Close the modal
                                                modal.hide();
                                            }
                                        });
                                    },
                                },
                            },
                            function(form,component){

                                // Loop through the process to add the details
                                for(const [key, value] of Object.entries(process)){

                                    // Check if the key is in the list of keys to ignore
                                    if(jQuery.inArray(key, ["category","description","targetTable"]) !== -1){

                                        // Create a field
                                        form.add(
                                            {
                                                name: key,
                                                label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
                                                icon: 'input-cursor-text',
                                                type: (key == 'description') ? 'textarea' : 'select',
                                                options: response[key] ?? [],
                                                modal: componentModal,
                                                value: process[key],
                                            }
                                        );
                                    }
                                }

                                // Open the modal
                                modal.show();
                            },
                        );
                    },
                );
            },
        });
    }

    // Create a row dictionary
    details.rows = {};

    // Loop through the process to add the details
    for(const [key, value] of Object.entries(process)){

        // Check if the key is in the list of keys to ignore
        if(jQuery.inArray(key, ["category","description","targetTable"]) !== -1){

            // Create a row
            var tr = $(document.createElement('tr')).appendTo(details.table.body);
            tr.icon = $(document.createElement('i')).addClass('bi bi-pencil-square me-1');
            tr.value = value;
            tr.header = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
            tr.th = $(document.createElement('th')).addClass('px-2 text-end border-end').css('width','250px').text(builder.Locale.get(tr.header)).appendTo(tr);
            tr.td = $(document.createElement('td')).addClass('px-2 cursor-pointer').attr('data-key',key).text(value).appendTo(tr);

            // Set a hover animation
            tr.td.hover(function(){
                $(this).addClass('text-bg-warning').prepend(tr.icon);
            },function(){
                $(this).removeClass('text-bg-warning');
                $(this).find('i').remove();
            });

            // Add a click event to the row
            tr.td.click(function(){

                // Create a modal
                details.edit();
            });

            // Save the row
            details.rows[key] = tr;
        }
    }

    // Select the last row
    details.table.body.last = details.table.body.children().last();

    // Style the last row
    details.table.body.last.addClass('rounded-bottom').find('> *').addClass('border-bottom-0');

    // Return the details
    return details;
}
// Create the Process Editor
const ProcessEditor = function(process, container){

    // Create the editor container
    var editor = $(document.createElement('div')).appendTo(container);

    // Generate options
    editor.options = {
        icons: [],
        colors: [],
        functions: [{id: '', text: builder.Locale.get("None")}],
    };

    // Generate icons options
    for(const [key, icon] of Object.entries(builder.Helper.bootstrapIcons())){
        editor.options.icons.push({id: icon, text: icon});
    }

    // Generate colors options
    for(const [key, color] of Object.entries(builder.Helper.bootstrapTextBg())){
        editor.options.colors.push({id: color, text: color});
    }

    // Retrieve the process functions
    editor.functions = ProcessFunctions();
    for(const [name, meta] of Object.entries(editor.functions)){
        var text = builder.Locale.get(meta.label)
        if(typeof meta.description !== 'undefined' && meta.description !== null && meta.description !== meta.label){
            text += ' - '+builder.Locale.get(meta.description);
        }
        editor.options.functions.push({id: name, text: text});
    }

    // Add a counter
    editor.counter = 0;

    // Create a dictionary for the steps
    editor.dictionary = {};

    // Create a function to assemble and save the process
    editor.save = function(){

        // Initialize the process
        var processTree = {}

        // Loop through the process to add the steps
        for(const [stepId, stepObject] of Object.entries(editor.dictionary)){

            // Retrieve the order of the step
            const stepOrder = parseInt(stepObject.attr('data-order'));

            // Add the step to the process
            processTree[stepOrder] = stepObject.step;

            // Reset the tasks
            processTree[stepOrder].tasks = {};

            // Process the step's dictionary of tasks
            for(const [taskId, taskObject] of Object.entries(stepObject.dictionary)){

                // Retrieve the order of the step
                const taskOrder = parseInt(taskObject.attr('data-order'));

                // Add the task to the step
                processTree[stepOrder].tasks[taskOrder] = taskObject.task;
            }
        }

        // Convert to JSON
        processJSON = JSON.stringify(processTree);

        // Create a modal
        builder.Component(
            "modal",
            null,
            {
                onEnter: false,
                destroy: true,
                icon: "question-circle",
                title: builder.Locale.get("Are you sure you?"),
                body: builder.Locale.get("Your are about to overwrite this process. Are you sure you want to continue?"),
                cancel: false,
                submit: true,
                callback: {
                    submit: function(element,modal){

                        // Create a spinner animate-rotate
                        var spinner = $(document.createElement('div')).attr({
                            "class": "animate-rotate rounded-circle border border-secondary border-4 d-none",
                            "style": "width: 96px; height: 96px; border-top-color: var(--bs-primary)!important;",
                        }).appendTo(element);

                        // Hide the dialog
                        element.dialog.addClass('opacity-0');

                        // Setup a spinner while waiting for the modal to be submitted
                        setTimeout(() => {

                            // Hide the dialog
                            element.dialog.hide();

                            // Add flex to the modal
                            element.addClass('d-flex align-items-center justify-content-center');

                            // Show the spinner
                            spinner.removeClass('d-none');

                            // AJAX Request
                            $.ajax({
                                url: '/endpoint.php/process/update?id=' + process.id,
                                headers: {'X-CSRF-Authorization': CSRF_KEY},
                                type: 'POST',dataType: 'json',
                                data: {process: processJSON},
                                success: function(response) {

                                    // Update CSRF Token
                                    CSRF_KEY = response.CSRF.key;
                                    CSRF_TOKEN = response.CSRF.token;

                                    // Close the modal
                                    modal.hide();

                                    // Create a modal
                                    builder.Component(
                                        "modal",
                                        null,
                                        {
                                            onEnter: false,
                                            destroy: true,
                                            icon: "question-circle",
                                            title: builder.Locale.get("Do you?"),
                                            body: builder.Locale.get("Do you want to apply the changes to existing tasks? This will update the tasks with the new process details. Although it may reset some of the progress."),
                                            cancel: false,
                                            submit: true,
                                            callback: {
                                                submit: function(element,modal){

                                                    // Create a spinner animate-rotate
                                                    var spinner = $(document.createElement('div')).attr({
                                                        "class": "animate-rotate rounded-circle border border-secondary border-4 d-none",
                                                        "style": "width: 96px; height: 96px; border-top-color: var(--bs-primary)!important;",
                                                    }).appendTo(element);

                                                    // Hide the dialog
                                                    element.dialog.addClass('opacity-0');

                                                    // Setup a spinner while waiting for the modal to be submitted
                                                    setTimeout(() => {

                                                        // Hide the dialog
                                                        element.dialog.hide();

                                                        // Add flex to the modal
                                                        element.addClass('d-flex align-items-center justify-content-center');

                                                        // Show the spinner
                                                        spinner.removeClass('d-none');

                                                        // AJAX Request
                                                        $.ajax({
                                                            url: '/endpoint.php/tasks/upgrade?category=' + process.category,
                                                            type: 'GET',dataType: 'json',
                                                            success: function(response) {
                                                                console.log(response);

                                                                // Close the modal
                                                                modal.hide();
                                                            }
                                                        });
                                                    }, 300);
                                                },
                                            },
                                        },
                                        function(modal,component){

                                            // Save the component
                                            const componentModal = component;

                                            // Style the modal
                                            component.header.addClass('text-bg-warning');
                                            component.footer.submit.addClass('btn-warning').removeClass('btn-link').attr({
                                                "style": "border-bottom-right-radius: var(--bs-modal-inner-border-radius) !important;border-bottom-left-radius: var(--bs-modal-inner-border-radius) !important;",
                                            }).text(builder.Locale.get('Apply Changes'));
                                            component.footer.submit.icon = $(document.createElement('i')).addClass('bi bi-check-lg me-1').prependTo(component.footer.submit);

                                            // Open the modal
                                            modal.show();
                                        },
                                    );
                                }
                            });
                        }, 300);
                    },
                },
            },
            function(modal,component){

                // Save the component
                const componentModal = component;

                // Style the modal
                component.header.addClass('text-bg-success');
                component.footer.submit.addClass('btn-success').removeClass('btn-link').attr({
                    "style": "border-bottom-right-radius: var(--bs-modal-inner-border-radius) !important;border-bottom-left-radius: var(--bs-modal-inner-border-radius) !important;",
                }).text(builder.Locale.get('Save Changes'));
                component.footer.submit.icon = $(document.createElement('i')).addClass('bi bi-save me-1').prependTo(component.footer.submit);

                // Open the modal
                modal.show();
            },
        );
    }

    // Create a temporary save button
    editor.saveButton = $(document.createElement('button')).attr({
        "type": "button",
        "class": "btn btn-success rounded-0 w-100 mb-3",
    }).html('<i class="bi bi-save me-2"></i>'+builder.Locale.get("Save Changes")).prependTo(editor);
    editor.saveButton.click(function(){
        editor.save();
    });

    // Component
    builder.Component(
        "accordion",
        editor,
        {
            class: {
                accordion: null,
                item: null,
            },
            flush: true,
            alwaysOpen: false,
        },
        function(accordion,component){

            // Save the accordion within the editor
            editor.accordion = accordion;

            // Setup jQuery UI Sortable
            component.sortable(
                {
                    connectWith: '#'+component.id,
                    items: '> .accordion-item.step',
                    handle: '.stepHandle',
                    placeholder: 'accordion-placeholder',
                    forcePlaceholderSize: true,
                    axis: 'y',
                    cancel:'',
                    start: function(event, ui){
                        ui.placeholder.height(ui.item.outerHeight());
                    },
                    stop: function(event, ui){
                        $(event.target).find('.accordion-item.step').each(function(index){
                            $(this).attr('data-order',index +1);
                        });
                    },
                }
            );

            // Create a functiion to add a step
            editor.add = function(step = {}){

                // Add the step to the accordion
                editor.accordion.add(
                    {
                        icon: step.icon ?? 'circle',
                        title: builder.Locale.get(step.name ?? 'New'),
                    },
                    function(stepItem){

                        // Increment the counter
                        editor.counter++;

                        // Set the parameters
                        stepItem.id = editor.counter;
                        stepItem.attr({"data-order": (Object.entries(editor.dictionary).length + 1),"data-id": stepItem.id});
                        stepItem.dictionary = {};

                        // Create a functiion to add a step
                        stepItem.add = function(task = {}){

                            // Add the step to the accordion
                            stepItem.accordion.add(
                                {
                                    title: builder.Locale.get(task.name ?? 'New'),
                                },
                                function(taskItem){

                                    // Increment the counter
                                    editor.counter++;

                                    // Set the parameters
                                    taskItem.id = editor.counter;
                                    taskItem.attr({"data-order": (Object.entries(stepItem.dictionary).length + 1),"data-id": taskItem.id});

                                    // Create a function to update the task
                                    taskItem.update = function(task){

                                        // Update the task
                                        taskItem.task = {
                                            "name": "New",
                                            "value": null,
                                            "isDisabled": false,
                                            "onComplete": null,
                                            "description": null,
                                            "isCompleted": false,
                                            "cost": 0.00,
                                        };

                                        // Loop through the task's details to sanitize the values
                                        for(const [key, value] of Object.entries(task)){
                                            if(typeof taskItem.task[key] !== 'undefined'){
                                                if(typeof value === 'string' && value === ''){
                                                    taskItem.task[key] = null;
                                                } else {
                                                    taskItem.task[key] = value;
                                                }
                                            }
                                        }

                                        // Update the title
                                        taskItem.title.text(builder.Locale.get(taskItem.task.name));

                                        // Loop through the process to update the task's details
                                        for(const [key, value] of Object.entries(taskItem.task)){

                                            // Check if the key is in the list of keys to ignore
                                            if(jQuery.inArray(key, ["tasks","icon","name","color","isCompleted"]) !== -1){
                                                continue;
                                            }

                                            // Update the row
                                            if(typeof taskItem.content.table.rows[key] !== 'undefined'){
                                                taskItem.content.table.rows[key].value = value;
                                                taskItem.content.table.rows[key].td.text(value);
                                            }
                                        }
                                    }

                                    // Create a function to edit the task
                                    taskItem.edit = function(){

                                        // Create a modal
                                        builder.Component(
                                            "modal",
                                            {
                                                callback: {
                                                    submit: function(element,modal){
                                                        element.form.submit();
                                                    },
                                                },
                                                icon: "pencil-square",
                                                title: "Edit Task's Details",
                                                size: 'xl',
                                            },
                                            function(modal,component){

                                                // Save Modal Component for select2 fields
                                                const componentModal = component;

                                                // Styling
                                                component.header.addClass('text-bg-warning');
                                                component.footer.submit.text('Apply changes').addClass('btn-success').removeClass('btn-link');
                                                component.footer.submit.icon = $(document.createElement('i')).addClass('bi bi-check-circle me-1').prependTo(component.footer.submit);

                                                // Create Form
                                                component.form = builder.Component(
                                                    'form',
                                                    component.body,
                                                    {
                                                        class:{
                                                            form: 'row g-3',
                                                            field: 'col-12',
                                                        },
                                                        callback:{
                                                            submit: function(form){

                                                                // Loop through the form values to update the task
                                                                for(const [key, value] of Object.entries(form.val())){
                                                                    // Check if the key exists in the task
                                                                    if(typeof taskItem.task[key] !== 'undefined'){
                                                                        // Update the task
                                                                        taskItem.task[key] = value;
                                                                    }
                                                                }

                                                                // Update the task
                                                                taskItem.update(taskItem.task);

                                                                // Close the modal
                                                                modal.hide();
                                                            },
                                                        },
                                                    },
                                                    function(form,component){

                                                        // Loop through the step to add the details
                                                        for(const [key, value] of Object.entries(taskItem.task)){

                                                            // Check if the key is in the list of keys to ignore
                                                            if(jQuery.inArray(key, ["name","description","onComplete","value","isDisabled","cost"]) !== -1){

                                                                // Create the corresponding field
                                                                switch(key){
                                                                    case 'isDisabled':
                                                                        form.add(
                                                                            {
                                                                                name: key,
                                                                                label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
                                                                                icon: 'toggles2',
                                                                                type: 'switch',
                                                                                modal: componentModal,
                                                                                value: value,
                                                                            },
                                                                        );
                                                                        break;
                                                                    case 'onComplete':
                                                                        form.add(
                                                                            {
                                                                                name: key,
                                                                                label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
                                                                                icon: 'code-slash',
                                                                                type: 'select2',
                                                                                options: editor.options.functions,
                                                                                modal: componentModal,
                                                                                value: value,
                                                                            },
                                                                        );
                                                                        break;
                                                                    case 'cost':
                                                                        form.add(
                                                                            {
                                                                                name: key,
                                                                                label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
                                                                                icon: 'currency-dollar',
                                                                                type: 'number',
                                                                                value: value,
                                                                            },
                                                                            function(input){
                                                                                input.input.attr('step', '0.01');
                                                                                input.input.attr('min', '0');
                                                                                input.input.attr('max', '24');
                                                                            }
                                                                        );
                                                                        break;
                                                                    default:
                                                                        form.add(
                                                                            {
                                                                                name: key,
                                                                                label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
                                                                                icon: 'input-cursor-text',
                                                                                type: (key == 'description') ? 'textarea' : 'text',
                                                                                modal: componentModal,
                                                                                value: value,
                                                                            }
                                                                        );
                                                                        break;
                                                                }
                                                            }
                                                        }

                                                        // Open the modal
                                                        modal.show();
                                                    },
                                                );
                                            },
                                        );
                                    }

                                    // Styling
                                    taskItem.addClass('bg-transparent task');
                                    taskItem.header.addClass('d-flex align-items-center');
                                    taskItem.header.button.addClass('p-2 fs-5');
                                    taskItem.content.addClass('p-0');

                                    // Add a handle to the header
                                    taskItem.handle = $(document.createElement('button')).attr({
                                        "class": "btn btn-light border-0 rounded-0 p-2 fs-5 taskHandle",
                                        "style": "line-height: 1.2;",
                                    }).prependTo(taskItem.header);
                                    taskItem.handle.icon = $(document.createElement('i')).addClass('bi bi-arrows-move').prependTo(taskItem.handle);

                                    // Add a delete button to the header
                                    taskItem.delete = $(document.createElement('button')).attr({
                                        "class": "btn btn-danger border-0 rounded-0 p-2 fs-5",
                                        "style": "line-height: 1.2;",
                                    }).appendTo(taskItem.header);
                                    taskItem.delete.icon = $(document.createElement('i')).addClass('bi bi-trash').prependTo(taskItem.delete);
                                    taskItem.delete.click(function(){

                                        // Remove the step
                                        taskItem.remove();

                                        // Remove the step from the dictionary
                                        delete stepItem.dictionary[taskItem.id];

                                        // Update the order of the steps
                                        stepItem.accordion._component.find('> .accordion-item.task').each(function(index){
                                            $(this).attr('data-order',index +1);
                                        });

                                        // Refresh sortable
                                        stepItem.accordion._component.sortable('refresh');
                                    });

                                    // Create Table
                                    taskItem.content.table = $(document.createElement('table')).addClass('table table-striped m-0 rounded-bottom').appendTo(taskItem.content);
                                    taskItem.content.table.body = $(document.createElement('tbody')).appendTo(taskItem.content.table);

                                    // Create a row dictionary
                                    taskItem.content.table.rows = {};

                                    // Initial insertion of the task
                                    taskItem.update(task);

                                    // Loop through the task to add the details
                                    for(const [key, value] of Object.entries(taskItem.task)){

                                        // Check if the key is in the list of keys to ignore
                                        if(jQuery.inArray(key, ["name","isCompleted"]) !== -1){
                                            continue;
                                        }

                                        // Create a row
                                        const tr = $(document.createElement('tr')).appendTo(taskItem.content.table.body);
                                        tr.icon = $(document.createElement('i')).addClass('bi bi-pencil-square me-1');
                                        tr.value = value;
                                        tr.header = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
                                        tr.th = $(document.createElement('th')).addClass('px-2 text-end border-end').css('width','250px').text(builder.Locale.get(tr.header)).appendTo(tr);
                                        tr.td = $(document.createElement('td')).addClass('px-2 cursor-pointer').attr('data-key',key).text(value).appendTo(tr);

                                        // Set a hover animation
                                        tr.td.hover(function(){
                                            $(this).addClass('text-bg-warning').prepend(tr.icon);
                                        },function(){
                                            $(this).removeClass('text-bg-warning');
                                            $(this).find('i').remove();
                                        });

                                        // Add a click event to the row
                                        tr.td.click(function(){

                                            // Create a modal
                                            taskItem.edit();
                                        });

                                        // Save the row
                                        taskItem.content.table.rows[key] = tr;
                                    }

                                    // Refresh sortable
                                    stepItem.accordion._component.sortable('refresh');

                                    // Update the task
                                    taskItem.update(task);

                                    // Save the task
                                    stepItem.dictionary[taskItem.id] = taskItem;
                                }
                            );
                        }

                        // Create a function to update the step
                        stepItem.update = function(step){

                            // Update the step
                            stepItem.step = {
                                "icon": "circle",
                                "name": "New",
                                "color": "secondary",
                                "tasks": {},
                                "value": null,
                                "onComplete": null,
                                "description": null,
                                "isCompleted": false
                            };

                            // Loop through the step's details to sanitize the values
                            for(const [key, value] of Object.entries(step)){
                                if(typeof stepItem.step[key] !== 'undefined'){
                                    if(typeof value === 'string' && value === ''){
                                        stepItem.step[key] = null;
                                    } else {
                                        stepItem.step[key] = value;
                                    }
                                }
                            }

                            // Update the title
                            stepItem.title.text(builder.Locale.get(stepItem.step.name));

                            // Update the icon
                            stepItem.icon.removeClass(function(index, className) {
                                return (className.match(/(^|\s)bi-\S+/g) || []).join(' ');
                            }).addClass('bi-'+stepItem.step.icon);

                            // Update the color
                            stepItem.header.button.removeClass(function(index, className) {
                                return (className.match(/(^|\s)text-bg-\S+/g) || []).join(' ');
                            }).addClass('text-bg-'+stepItem.step.color);

                            // Loop through the process to update the step's details
                            for(const [key, value] of Object.entries(stepItem.step)){

                                // Check if the key is in the list of keys to ignore
                                if(jQuery.inArray(key, ["tasks","icon","name","color","isCompleted"]) !== -1){
                                    continue;
                                }

                                // Update the row
                                if(typeof stepItem.content.table.rows[key] !== 'undefined'){
                                    stepItem.content.table.rows[key].value = value;
                                    stepItem.content.table.rows[key].td.text(value);
                                }
                            }
                        }

                        // Create a function to edit the step
                        stepItem.edit = function(){

                            // Create a modal
                            builder.Component(
                                "modal",
                                {
                                    callback: {
                                        submit: function(element,modal){
                                            element.form.submit();
                                        },
                                    },
                                    icon: "pencil-square",
                                    title: "Edit Step's Details",
                                    size: 'xl',
                                },
                                function(modal,component){

                                    // Save Modal Component for select2 fields
                                    const componentModal = component;

                                    // Styling
                                    component.header.addClass('text-bg-warning');
                                    component.footer.submit.text('Apply changes').addClass('btn-success').removeClass('btn-link');
                                    component.footer.submit.icon = $(document.createElement('i')).addClass('bi bi-check-circle me-1').prependTo(component.footer.submit);

                                    // Create Form
                                    component.form = builder.Component(
                                        'form',
                                        component.body,
                                        {
                                            class:{
                                                form: 'row g-3',
                                                field: 'col-12',
                                            },
                                            callback:{
                                                submit: function(form){

                                                    // Loop through the form values to update the step
                                                    for(const [key, value] of Object.entries(form.val())){
                                                        // Check if the key exists in the step
                                                        if(typeof stepItem.step[key] !== 'undefined'){
                                                            // Update the step
                                                            stepItem.step[key] = value;
                                                        }
                                                    }

                                                    // Update the step
                                                    stepItem.update(stepItem.step);

                                                    // Close the modal
                                                    modal.hide();
                                                },
                                            },
                                        },
                                        function(form,component){

                                            // Loop through the step to add the details
                                            for(const [key, value] of Object.entries(stepItem.step)){

                                                // Check if the key is in the list of keys to ignore
                                                if(jQuery.inArray(key, ["color","icon","name","description","onComplete","value"]) !== -1){

                                                    // Create the corresponding field
                                                    switch(key){
                                                        case 'onComplete':
                                                            form.add(
                                                                {
                                                                    name: key,
                                                                    label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
                                                                    icon: 'code-slash',
                                                                    type: 'select2',
                                                                    options: editor.options.functions,
                                                                    modal: componentModal,
                                                                    value: value,
                                                                },
                                                            );
                                                            break;
                                                        case 'icon':
                                                            form.add(
                                                                {
                                                                    name: key,
                                                                    label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
                                                                    icon: 'image-alt',
                                                                    type: 'select2',
                                                                    options: editor.options.icons,
                                                                    modal: componentModal,
                                                                    value: value,
                                                                    callback:{
                                                                        format: function(option, component){

                                                                            // Check if the option is a placeholder
                                                                            if (!option.id) { return option.text; }

                                                                            // Create the option
                                                                            var $option = $(
                                                                                '<span class=""><i class="me-2 text-bg-light p-1 fs-4 rounded bi bi-' +  option.element.value.toLowerCase() + '"></i>' + option.text + '</span>'
                                                                            );

                                                                            // Return the option
                                                                            return $option;
                                                                        },
                                                                    },
                                                                },
                                                            );
                                                            break;
                                                        case 'color':
                                                            form.add(
                                                                {
                                                                    name: key,
                                                                    label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
                                                                    icon: 'palette',
                                                                    type: 'select2',
                                                                    options: editor.options.colors,
                                                                    value: value,
                                                                    modal: componentModal,
                                                                    callback:{
                                                                        format: function(option, component){

                                                                            // Check if the option is a placeholder
                                                                            if (!option.id) { return option.text; }

                                                                            // Create the option
                                                                            var $option = $(
                                                                                '<div class="px-3 py-2 animate-flicker-hover text-bg-' +  option.element.value.toLowerCase() + '" style="margin: -.375rem -.75rem!important;">' + option.text + '</div>'
                                                                            );

                                                                            // Return the option
                                                                            return $option;
                                                                        },
                                                                    },
                                                                },
                                                            );
                                                            break;
                                                        default:
                                                            form.add(
                                                                {
                                                                    name: key,
                                                                    label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
                                                                    icon: 'input-cursor-text',
                                                                    type: (key == 'description') ? 'textarea' : 'text',
                                                                    modal: componentModal,
                                                                    value: value,
                                                                }
                                                            );
                                                            break;
                                                    }
                                                }
                                            }

                                            // Open the modal
                                            modal.show();
                                        },
                                    );
                                },
                            );
                        }

                        // Styling
                        stepItem.addClass('bg-transparent step');
                        stepItem.header.addClass('d-flex align-items-center');
                        stepItem.header.button.addClass('p-2 fs-5');
                        stepItem.content.addClass('p-0');

                        // Add a handle to the header
                        stepItem.handle = $(document.createElement('button')).attr({
                            "class": "btn btn-light border-0 rounded-0 p-2 fs-5 stepHandle",
                            "style": "line-height: 1.2;",
                        }).prependTo(stepItem.header);
                        stepItem.handle.icon = $(document.createElement('i')).addClass('bi bi-arrows-move').prependTo(stepItem.handle);

                        // Add a delete button to the header
                        stepItem.delete = $(document.createElement('button')).attr({
                            "class": "btn btn-danger border-0 rounded-0 p-2 fs-5",
                            "style": "line-height: 1.2;",
                        }).appendTo(stepItem.header);
                        stepItem.delete.icon = $(document.createElement('i')).addClass('bi bi-trash').prependTo(stepItem.delete);
                        stepItem.delete.click(function(){

                            // Remove the step
                            stepItem.remove();

                            // Remove the step from the dictionary
                            delete editor.dictionary[stepItem.id];

                            // Update the order of the steps
                            editor.accordion._component.find('> .accordion-item.step').each(function(index){
                                $(this).attr('data-order',index +1);
                            });

                            // Refresh sortable
                            editor.accordion._component.sortable('refresh');
                        });

                        // Create Table
                        stepItem.content.table = $(document.createElement('table')).addClass('table table-striped m-0 rounded-bottom').appendTo(stepItem.content);
                        stepItem.content.table.body = $(document.createElement('tbody')).appendTo(stepItem.content.table);

                        // Create a row dictionary
                        stepItem.content.table.rows = {};

                        // Initial insertion of the step
                        stepItem.update(step);

                        // Loop through the step to add the details
                        for(const [key, value] of Object.entries(stepItem.step)){

                            // Check if the key is in the list of keys to ignore
                            if(jQuery.inArray(key, ["tasks","icon","name","color","isCompleted"]) !== -1){
                                continue;
                            }

                            // Create a row
                            const tr = $(document.createElement('tr')).appendTo(stepItem.content.table.body);
                            tr.icon = $(document.createElement('i')).addClass('bi bi-pencil-square me-1');
                            tr.value = value;
                            tr.header = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
                            tr.th = $(document.createElement('th')).addClass('px-2 text-end border-end').css('width','250px').text(builder.Locale.get(tr.header)).appendTo(tr);
                            tr.td = $(document.createElement('td')).addClass('px-2 cursor-pointer').attr('data-key',key).text(value).appendTo(tr);

                            // Set a hover animation
                            tr.td.hover(function(){
                                $(this).addClass('text-bg-warning').prepend(tr.icon);
                            },function(){
                                $(this).removeClass('text-bg-warning');
                                $(this).find('i').remove();
                            });

                            // Add a click event to the row
                            tr.td.click(function(){

                                // Create a modal
                                stepItem.edit();
                            });

                            // Save the row
                            stepItem.content.table.rows[key] = tr;
                        }

                        // Create a row
                        const taskRow = $(document.createElement('tr')).appendTo(stepItem.content.table.body);
                        taskRow.value = step.tasks;
                        taskRow.header = 'Tasks';
                        taskRow.th = $(document.createElement('th')).addClass('px-2 text-end border-end border-bottom-0').css('width','250px').text(builder.Locale.get(taskRow.header)).appendTo(taskRow);
                        taskRow.td = $(document.createElement('td')).addClass('p-0 border-bottom-0').attr('data-key','tasks').appendTo(taskRow);

                        // Create a new accordion for the tasks
                        builder.Component(
                            "accordion",
                            taskRow.td,
                            {
                                class: {
                                    accordion: null,
                                    item: null,
                                },
                                flush: true,
                                alwaysOpen: false,
                            },
                            function(accordion,component){

                                // Save the accordion within the editor
                                stepItem.accordion = accordion;

                                // Setup jQuery UI Sortable
                                component.sortable(
                                    {
                                        connectWith: '#'+component.id,
                                        items: '> .accordion-item.task',
                                        handle: '.taskHandle',
                                        placeholder: 'accordion-placeholder',
                                        forcePlaceholderSize: true,
                                        axis: 'y',
                                        cancel:'',
                                        start: function(event, ui){
                                            ui.placeholder.height(ui.item.outerHeight());
                                        },
                                        stop: function(event, ui){
                                            $(event.target).find('.accordion-item.task').each(function(index){
                                                $(this).attr('data-order',index +1);
                                            });
                                        },
                                    }
                                );

                                // Loop through the process to add the steps
                                for(const [order, task] of Object.entries(stepItem.step.tasks)){
                                    stepItem.add(task);
                                }

                                // Create a add button
                                stepItem.addButton = $(document.createElement('button')).attr({
                                    "type": "button",
                                    "class": "btn btn-success w-100 rounded-0 mt-3 mb-2",
                                }).html('<i class="bi bi-plus-lg me-2"></i>'+builder.Locale.get("Add a new task")).appendTo(taskRow.td);
                                stepItem.addButton.click(function(){
                                    stepItem.add();
                                });
                            },
                        );

                        // Save the row
                        stepItem.content.table.rows.tasks = taskRow;

                        // Refresh sortable
                        editor.accordion._component.sortable('refresh');

                        // Update the step
                        stepItem.update(step);

                        // Save the step
                        editor.dictionary[stepItem.id] = stepItem;
                    },
                );
            }

            // Loop through the process to add the steps
            for(const [order, step] of Object.entries(process.process)){
                editor.add(step);
            }

            // Create a add button
            editor.addButton = $(document.createElement('button')).attr({
                "type": "button",
                "class": "btn btn-success w-100 rounded-0 mt-3",
            }).html('<i class="bi bi-plus-lg me-2"></i>'+builder.Locale.get("Add a new step")).appendTo(editor);
            editor.addButton.click(function(){
                editor.add();
            });
        },
    );

    // Return the editor
    return editor;
}
