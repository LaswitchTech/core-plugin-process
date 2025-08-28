builder.add('widgets','processTree', class extends builder.ComponentClass {

    _stepper = null;
    _controls = null;
    _accordion = null;
    _pagination = null;
    #currentStep = 1;
    #currentTask = 1;
    _task = null;
    _steps = {};
    #interval = null;
    _initialized = false;
    _save = false;
    _callbacks = {};

    _init(){
        this._properties = {
            class: {
                component: null,
            },
            data: null,
            callback: {},
            interval: 1000,
        };
        this._properties.showFirst = false;
    }

    _create(){

        // Set Self
        const self = this;

        // Create Component
        this._component = $(document.createElement('div')).attr({
            'id': 'process' + this._id,
            'class': 'processTree',
        });
        this._component.id = this._component.attr('id');

        // Create the Stepper
        this._builder.Component(
            'stepper',
            this._component,
            this._properties,
            function(stepper, component){

                // Add a complete progress bar
                component.progress.addClass('progress-stacked');
                this._component.progress.complete = $(document.createElement('div')).attr({
                    'class': 'progress-bar progress-bar-striped progress-bar-animated text-bg-success',
                    'role': 'progressbar',
                    'aria-label': 'Complete',
                }).prependTo(component.progress);

                // Set _stepper
                self.#stepper(stepper);

                // Set _controls
                self.controls(component.controls);

                // Set _accordion
                self.accordion(component.steps.accordion);

                // Set _pagination
                self.pagination(component.pagination);

                // Load the task
                self.#load().then(function(task){
                    self.#render().then(function(){
                        self.render(!self._initialized);
                    }).catch(function(e){
                        console.error('Error rendering task:', e);
                    });
                }).catch(function(e){
                    console.error('Error loading task:', e);
                });
            },
        );
    }

    #load(){

        // Set Self
        const self = this;

        // Create a promise to handle the loading
        return new Promise((resolve, reject) => {
            try {
                // Retrieve the task
                $.ajax({
                    url: '/api/tasks/fetch?id='+self._properties.data,
                    type: 'GET',dataType: 'json',
                    error: function(response) {

                        // Reject the promise
                        reject(response);
                    },
                    success: function(response) {

                        // Set the task
                        self._task = response.record;

                        // Resolve the promise
                        resolve(self._task);
                    },
                });
            } catch(e) {
                // Reject the promise
                reject(e);
            }
        });
    }

    #render(){

        // Set Self
        const self = this;

        // Create a promise to handle the initial rendering
        return new Promise((resolve, reject) => {
            try {

                // Generate Steps and Tasks
                const stepsLength = Object.entries(self._task.process ?? []).length;
                for(const [order, stepData] of Object.entries(self._task.process ?? [])){
                    self.#stepper().add(
                        {
                            'label': self._builder.Locale.get(stepData.name),
                            'icon': stepData.icon,
                            'tooltip': stepData.description,
                        },
                        function(itemStep){

                            // Create a List
                            self._builder.Component(
                                'list',
                                itemStep.content,
                                {
                                    class: {
                                        component: 'processTree-list',
                                    },
                                    icon: "square",
                                },
                                function(list, component){

                                    // Set _steps
                                    self._steps[order] = {list: list, step: itemStep, tasks: {}};

                                    // Loop through the tasks
                                    const tasksLength = Object.entries(stepData.tasks ?? []).length;
                                    for(const [taskOrder, taskData] of Object.entries(stepData.tasks ?? [])){

                                        // Add the task to the list
                                        list.add(
                                            {
                                                class: 'processTree-list-item',
                                                field: builder.Locale.get(taskData.name),
                                                click: null,
                                                tooltip: taskData.description,
                                            },
                                            function(itemTask){

                                                // Store the task
                                                self._steps[order].tasks[taskOrder] = itemTask;

                                                // Check if the rendering is complete
                                                if(stepsLength === parseInt(order) && tasksLength === parseInt(taskOrder)){

                                                    // Resolve the promise
                                                    resolve();
                                                }
                                            },
                                        );
                                    }
                                }
                            );
                        }
                    );
                }
            } catch(e) {
                reject(e);
            }
        });
    }

    render(show = false){

        // Set Self
        const self = this;

        // Loop through the steps
        let current = null;
        const stepsLength = Object.entries(this._steps ?? []).length;
        for(const [stepOrder, step] of Object.entries(this._steps ?? [])){
            const stepData = this._task.process[stepOrder];

            if(stepData.isCompleted){
                self.#currentStep = (parseInt(stepOrder) + 1);
                step.step.control.removeClass('btn-gray-400').addClass('btn-success');
                step.step.control.mobile.btn.removeClass('text-bg-gray-400').addClass('text-bg-success');
                self.#stepper()._component.progress.complete.css('width',(((stepOrder - 1) / (stepsLength - 1)) * 100).toFixed(2) + '%');
            }
            if(self.#currentStep > stepsLength){
                self.#currentStep = stepsLength;
            }
            if(self.#currentStep === parseInt(stepOrder)){
                step.step.control.addClass('btn-gray-400');
                step.step.control.mobile.btn.addClass('text-bg-gray-400');
                current = step.step.content.bootstrap;
            }

            // Loop through the tasks
            const tasksLength = Object.entries(step.tasks ?? []).length;
            for(const [taskOrder, task] of Object.entries(step.tasks ?? [])){
                const taskData = this._task.process[stepOrder].tasks[taskOrder];

                if(taskData.isDisabled){
                    task.addClass('disable');
                    self.#exec(stepOrder, taskOrder, taskData.onComplete);
                    if(!self._initialized && taskData.emphasize){
                        task.click(function(e){
                            e.preventDefault();
                            e.stopPropagation();
                            self.#emphasize(stepOrder, taskOrder, taskData.emphasize);
                        });
                    }
                } else {
                    if(!self._initialized){
                        task.click(function(e){
                            e.preventDefault();
                            e.stopPropagation();
                            self.#exec(stepOrder, taskOrder, taskData.onComplete);
                        });
                    }
                }

                if(taskData.isCompleted){
                    task.icon.removeClass('bi-square').addClass('bi-check-square');
                    task.addClass('done');
                    task.off('click');
                    self.#currentTask = (parseInt(taskOrder) + 1);
                    if(self.#currentTask > tasksLength){
                        self.#currentTask = 1;
                    }
                }

                if(stepsLength === parseInt(stepOrder) && tasksLength === parseInt(taskOrder)){

                    // Check if the step is completed
                    if(self._save){
                        self.save();
                    }

                    // Check if the step is the current step and show the content
                    if(show){
                        current.show();
                    }

                    // Check if the stepper is initialized
                    if(!self._initialized){
                        self._initialized = true;
                        self.start();
                    }
                }
            }
        }
    }

    start(){
        // Set Self
        const self = this;

        // Check if the stepper is initialized
        if(!this._initialized){
            console.error('Stepper is not initialized yet.');
            return;
        }

        // Check if the interval is already set
        if(this.#interval){
            console.warn('Interval is already set, stopping the previous one.');
            clearInterval(this.#interval);
        }

        // Set the interval to check for changes
        this.#interval = setInterval(function(){
            self.render();
        }, this._properties.interval);
    }

    stop(){
        // Check if the interval is set
        if(this.#interval){
            clearInterval(this.#interval);
            this.#interval = null;
        } else {
            console.warn('No interval is currently set.');
        }
    }

    #emphasize(step, task, selector = null){

        // Set Self
        const self = this;

        // Check if the selector is valid
        if($(selector).length <= 0){
            console.error('Invalid selector:', selector);
            return;
        }

        // Retrieve the step and task data
        const stepData = this._task.process[step];
        const taskData = stepData.tasks[task];

        // Retrieve the length of the steps and tasks
        const stepsLength = Object.entries(this._steps ?? []).length;
        const tasksLength = Object.entries(stepData.tasks ?? []).length;

        // Check if the task is the current task
        if(this.#currentStep === parseInt(step) && this.#currentTask === parseInt(task)){

            // Add an overlay
            const overlay = $('<div class="emphasized-overlay"></div>').appendTo('body');

            // Add the emphasized class and click event
            $(selector).addClass('emphasized').click(function(e){
                e.preventDefault();
                e.stopPropagation();
                $(selector).removeClass('emphasized');
                $('.emphasized-overlay').remove();
            });
        }
    }

    #exec(step, task, callback = null){

        // Set Self
        const self = this;

        // Retrieve the step and task data
        const stepData = this._task.process[step];
        const taskData = stepData.tasks[task];

        // Retrieve the length of the steps and tasks
        const stepsLength = Object.entries(this._steps ?? []).length;
        const tasksLength = Object.entries(stepData.tasks ?? []).length;

        // Check if the task is already completed
        if(!taskData.isCompleted){

            // Check if the task is the current task
            if(this.#currentStep === parseInt(step) && this.#currentTask === parseInt(task)){
                if(callback){
                    this.#call(callback, this._task, taskData.value, function(){
                        self._task.process[step].tasks[task].isCompleted = true;
                        if(tasksLength === parseInt(task)){
                            self._task.process[step].isCompleted = true;
                            self._task.progress = (parseInt(step) + 1);
                            self._task.progress = (self._task.progress > stepsLength) ? stepsLength : self._task.progress;
                            self.#currentStep = self._task.progress;
                        }
                        self.save();
                    });
                } else {
                    this._task.process[step].tasks[task].isCompleted = true;
                    if(tasksLength === parseInt(task)){
                        this._task.process[step].isCompleted = true;
                        this._task.progress = (parseInt(step) + 1);
                        this._task.progress = (this._task.progress > stepsLength) ? stepsLength : this._task.progress;
                        this.#currentStep = this._task.progress;
                    }
                    this.save();
                }
            }
        }
    }

    #call(name, ...args) {

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

    save(){

        // Set Self
        const self = this;

        // Retrieve the step and task data
        const stepData = this._task.process[this.#currentStep];

        // Save the task
        $.ajax({
            url: '/api/tasks/update?id=' + this._task.id,
            headers: {'X-CSRF-Authorization': CSRF_KEY},
            type: 'POST',dataType: 'json',
            data: {process: this._task.process, progress: this.#currentStep},
            success: function(response) {

                // Update any status badge
                var badges = $('.badge[data-type="status"][data-task="'+self._task.id+'"]');
                badges.each(function(){
                    var badge = $(this);

                    // Remove any classes starting with text-bg-
                    badge.removeClass(function(index, className) {
                        return (className.match(/(^|\s)text-bg-\S+/g) || []).join(' ');
                    });

                    // Set the new background color
                    badge.addClass('text-bg-'+stepData.color);

                    // Clear the content of the badge
                    badge.html('');

                    // Add the new label
                    badge.text(builder.Locale.get(stepData.name));

                    // Insert the new icon
                    var icon = $(document.createElement('i')).addClass('me-1 bi bi-'+stepData.icon).prependTo(badge);
                });

                // Render the changes
                self.render(true);
            },
        });
    }

    #callbacks(name = null){

        // Check if callbacks are already cached
        if(Object.keys(this._callbacks).length <= 0){

            // Return cached callbacks if available
            var callbacks = {};
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
                    callbacks[name] = metadata;
                }
            }

            // Save the callbacks
            this._callbacks = callbacks;
        }

        if(name){
            return this._callbacks[name] || null;
        } else {
            return this._callbacks;
        }
    }

    #stepper(stepper = null){
        if(stepper){
            this._stepper = stepper;
        }
        return this._stepper;
    }

    controls(controls = null){
        if(controls){
            this._controls = controls;
        }
        return this._controls;
    }

    accordion(accordion = null){
        if(accordion){
            this._accordion = accordion;
        }
        return this._accordion;
    }

    pagination(pagination = null){
        if(pagination){
            this._pagination = pagination;
        }
        return this._pagination;
    }
});
builder.add('widgets','processEditor', class extends builder.ComponentClass {

    _init(){
        this._properties = {
            class: {
                component: null,
            },
            data: null,
            callback: {},
        };
        this._data = null;
        this._stages = {};
        this._process = {};
        this._current = {
            stage: 1,
            task: 1,
        };
    }

    _create(){

        // Set Self
        const self = this;

        // Create Component
        this._component = $(document.createElement('div')).attr({
            'id': 'processEditor' + this._id,
            'class': 'processEditor-widget',
        });
        this._component.id = this._component.attr('id');

        // Check if we should add classes
        if(this._properties.class.component){
            this._component.addClass(this._properties.class.component);
        }

        // Fetch the process data
        $.ajax({
            url: '/api/process/fetch?id='+self._properties.data,
            type: 'GET',dataType: 'json',
            error: function(xhr, status, error) {
                let color = 'info', icon = 'question-circle', title = builder.Locale.get(xhr.statusText), content = builder.Locale.get(xhr.responseText);
                switch(xhr.status){
                    case 403: color = 'danger'; icon = 'shield-lock'; break;
                    case 404: color = 'warning'; icon = 'question-diamond'; break;
                    case 500: color = 'danger'; icon = 'bug'; break;
                }
                self._builder.Component(
                    "alert",
                    self._component,
                    {
                        class: {
                            component: 'm-3',
                        },
                        dismissible: false,
                        icon:icon,
                        color:color,
                        title:title
                    },
                    function(alert,component){
                        component.content.html('<pre class="m-0 p-2">'+content+'</pre>');
                    }
                );
            },
            success: function(response) {

                // Store the data
                self.data(response);
                console.log(self.data());

                // Create a grid
                self._component.grid = $(document.createElement('div')).addClass('process-grid row g-0 m-0').appendTo(self._component);

                // Create additional columns
                self._component.grid.col1 = $(document.createElement('div')).addClass('col-12 col-md-3').appendTo(self._component.grid);
                self._component.grid.col2 = $(document.createElement('div')).addClass('col-12 col-md-9').appendTo(self._component.grid);

                // Create the meta section
                self._component.grid.meta = $(document.createElement('div')).addClass('process-meta col-12').prependTo(self._component.grid);
                self._component.grid.meta.title = $(document.createElement('div')).addClass('process-meta-bar').html('<h5 class="m-0">'+self._builder.Locale.get('Process Meta')+'</h5>').appendTo(self._component.grid.meta);
                self._component.grid.meta.tree = $(document.createElement('div')).addClass('p-3 py-2 border-bottom').appendTo(self._component.grid.meta);

                // Create the meta form
                self._builder.Utility(
                    'form',
                    self._component.grid.meta.tree,
                    {
                        class: {
                            component: 'row g-3',
                        },
                        callback: {
                            val: function(values){
                                self._component.grid.col2.stage.form.submit();
                                self._component.grid.col2.task.form.submit();
                                values.description = values.description ?? null;
                                for(const [sorder, stage] of Object.entries(self._process)){
                                    stage.name = (stage.name === '') ? null : stage.name;
                                    stage.description = (stage.description === '') ? null : stage.description;
                                    stage.color = (stage.color === '') ? null : stage.color;
                                    stage.icon = (stage.icon === '') ? null : stage.icon;
                                    stage.isCompleted = (stage.isCompleted === true || stage.isCompleted === 1 || stage.isCompleted === '1' || stage.isCompleted === 'true') ? true : false;
                                    for(const [torder, task] of Object.entries(stage.tasks)){
                                        task.name = (task.name === '') ? null : task.name;
                                        task.description = (task.description === '') ? null : task.description;
                                        task.value = (task.value === '') ? null : task.value;
                                        task.emphasize = (task.emphasize === '') ? null : task.emphasize;
                                        task.onComplete = (task.onComplete === '') ? null : task.onComplete;
                                        task.cost = parseInt(task.cost);
                                        task.isCompleted = (task.isCompleted === true || task.isCompleted === 1 || task.isCompleted === '1' || task.isCompleted === 'true') ? true : false;
                                        task.isDisabled = (task.isDisabled === true || task.isDisabled === 1 || task.isDisabled === '1' || task.isDisabled === 'true') ? true : false;
                                        stage.tasks[torder] = task;
                                    }
                                    self._process[sorder] = stage;
                                }
                                values.process = JSON.stringify(self._process);
                                return values;
                            },
                            submit: function(form){
                                self.save();
                            },
                        }
                    },
                    function(form,component){

                        // Store the form
                        self._component.grid.meta.form = form;

                        // category
                        form.add(
                            'select2',
                            {
                                name: 'category',
                                label: self._builder.Locale.get('Category'),
                                placeholder: self._builder.Locale.get('Select a category'),
                                options: self.categories(),
                                value: self.data().record.category ?? null,
                                class: {
                                    component: 'col-12 col-md-6',
                                },
                            }
                        );

                        // targetTable
                        form.add(
                            'select2',
                            {
                                name: 'targetTable',
                                label: self._builder.Locale.get('Table'),
                                placeholder: self._builder.Locale.get('Select a table'),
                                options: self.tables(),
                                value: self.data().record.targetTable ?? null,
                                class: {
                                    component: 'col-12 col-md-6',
                                },
                            }
                        );

                        // description
                        form.add(
                            'textarea',
                            {
                                name: 'description',
                                label: self._builder.Locale.get('Description'),
                                placeholder: self._builder.Locale.get('Enter a description'),
                                value: self.data().record.description ?? null,
                                class: {
                                    component: 'col-12',
                                },
                            },
                            function(input){
                                input._component.input.attr({'rows': 5,'style': 'resize: none;'});
                            },
                        );

                        // submit
                        form.add(
                            'submit',
                            {
                                name: 'submit',
                                value: self._builder.Locale.get('Save Changes'),
                                class: {
                                    component: 'col-12 justify-content-end',
                                },
                            },
                            function(input){
                                input._component.input.removeClass('btn-primary').addClass('btn-success');
                                $(document.createElement('button')).attr({
                                    'type': 'button',
                                    'class': 'btn btn-warning',
                                }).text(self._builder.Locale.get('Apply')).appendTo(input._component).click(function(){
                                    self.apply();
                                });
                                $(document.createElement('button')).attr({
                                    'type': 'button',
                                    'class': 'btn btn-light',
                                }).text(self._builder.Locale.get('Import')).appendTo(input._component).click(function(){
                                    self.import();
                                });
                                $(document.createElement('button')).attr({
                                    'type': 'button',
                                    'class': 'btn btn-primary',
                                }).text(self._builder.Locale.get('Export')).appendTo(input._component).click(function(){
                                    self.export();
                                });
                            },
                        );
                    },
                );

                // Create the stages section
                self._component.grid.col1.stages = $(document.createElement('div')).addClass('process-stages').appendTo(self._component.grid.col1);
                self._component.grid.col1.stages.bar = $(document.createElement('div')).addClass('process-stages-bar').appendTo(self._component.grid.col1.stages);
                self._component.grid.col1.stages.bar.title = $(document.createElement('h5')).text(self._builder.Locale.get('Stages')).appendTo(self._component.grid.col1.stages.bar);
                self._component.grid.col1.stages.bar.add = $(document.createElement('button')).attr({
                    'type': 'button',
                    'class': 'btn btn-success ms-auto',
                }).html('<i class="bi bi-plus-lg"></i>').appendTo(self._component.grid.col1.stages.bar).click(function(){
                    self.addStage();
                    self.render();
                });
                self._component.grid.col1.stages.tree = $(document.createElement('div')).addClass('process-stages-tree border-bottom').appendTo(self._component.grid.col1.stages);

                // Create the tabs section
                self._builder.Component(
                    "tabs",
                    self._component.grid.col2,
                    {
                        class: {
                            navbar: 'nav-pills',
                        },
                    },
                    function(tabs,card){

                        // Styling
                        card._component.tools.remove();
                        card._component.header.addClass('bg-gray-200 rounded-0');
                        card._component.header.heading.addClass('m-0');
                        card._component.card.addClass('border-0 rounded-0');
                        card._component.body.removeClass('card-body');

                        // Editor
                        tabs.add(
                            'editor',
                            {
                                icon: "pencil-square",
                                label: builder.Locale.get("Editor"),
                            },
                            function(tab,nav){

                                // Create the stage section
                                self._component.grid.col2.stage = $(document.createElement('div')).addClass('process-stage').appendTo(tab);
                                self._component.grid.col2.stage.bar = $(document.createElement('div')).addClass('process-stage-bar').appendTo(self._component.grid.col2.stage);
                                self._component.grid.col2.stage.bar.title = $(document.createElement('h5')).text(self._builder.Locale.get('Stage')).appendTo(self._component.grid.col2.stage.bar);
                                self._component.grid.col2.stage.bar.badge = $(document.createElement('span')).attr({
                                    'class': 'badge text-bg-primary ms-2',
                                    'data-stage': self._current.stage,
                                }).text('#'+self._current.stage).appendTo(self._component.grid.col2.stage.bar);
                                self._component.grid.col2.stage.bar.controls = $(document.createElement('div')).attr({
                                    'class': 'btn-group border rounded ms-auto',
                                }).appendTo(self._component.grid.col2.stage.bar);
                                self._component.grid.col2.stage.bar.controls.up = $(document.createElement('button')).attr({
                                    'type': 'button',
                                    'class': 'btn btn-light',
                                }).html('<i class="bi bi-chevron-up"></i>').appendTo(self._component.grid.col2.stage.bar.controls).click(function(){
                                    self.indexStages((self._current.stage - 1));
                                });
                                self._component.grid.col2.stage.bar.controls.down = $(document.createElement('button')).attr({
                                    'type': 'button',
                                    'class': 'btn btn-light',
                                }).html('<i class="bi bi-chevron-down"></i>').appendTo(self._component.grid.col2.stage.bar.controls).click(function(){
                                    self.indexStages((self._current.stage + 1));
                                });
                                self._component.grid.col2.stage.bar.controls.delete = $(document.createElement('button')).attr({
                                    'type': 'button',
                                    'class': 'btn btn-danger',
                                }).html('<i class="bi bi-trash"></i>').appendTo(self._component.grid.col2.stage.bar.controls).click(function(){
                                    self.deleteStage();
                                });
                                self._component.grid.col2.stage.tree = $(document.createElement('div')).addClass('border-bottom p-3 py-2').appendTo(self._component.grid.col2.stage);

                                // Create the stage form
                                self._builder.Utility(
                                    'form',
                                    self._component.grid.col2.stage.tree,
                                    {
                                        class: {
                                            component: 'row g-3',
                                        },
                                        callback: {
                                            val: function(values){
                                                values.name = values.name ?? null;
                                                values.description = values.description ?? null;
                                                values.color = values.color ?? null;
                                                values.icon = values.icon ?? null;
                                                return values;
                                            },
                                            submit: function(form){
                                                for(const [key, value] of Object.entries(form.val())){
                                                    self._process[self._current.stage][key] = value;
                                                }
                                            },
                                        }
                                    },
                                    function(form,component){

                                        // Store the form
                                        self._component.grid.col2.stage.form = form;

                                        // name
                                        form.add(
                                            'text',
                                            {
                                                name: 'name',
                                                label: self._builder.Locale.get('Name'),
                                                placeholder: self._builder.Locale.get('Enter a name'),
                                                class: {
                                                    component: 'col-12',
                                                },
                                            },
                                            function(input){
                                                input._component.input.attr({'rows': 5,'style': 'resize: none;'});
                                            },
                                        );

                                        // description
                                        form.add(
                                            'textarea',
                                            {
                                                name: 'description',
                                                label: self._builder.Locale.get('Description'),
                                                placeholder: self._builder.Locale.get('Enter a description'),
                                                class: {
                                                    component: 'col-12',
                                                },
                                            },
                                            function(input){
                                                input._component.input.attr({'rows': 5,'style': 'resize: none;'});
                                            },
                                        );

                                        // color
                                        form.add(
                                            'select2',
                                            {
                                                name: 'color',
                                                label: self._builder.Locale.get('Color'),
                                                placeholder: self._builder.Locale.get('Select a color'),
                                                options: self.colors(),
                                                class: {
                                                    component: 'col-12 col-md-6',
                                                },
                                                callback:{
                                                    format: function(option, component){
                                                        if (!option.id) { return option.text; }
                                                        return $('<div class="px-3 py-2 animate-flicker-hover text-bg-' +  option.element.value.toLowerCase() + '" style="margin: -.375rem -.75rem!important;">' + option.text + '</div>');;
                                                    },
                                                },
                                            }
                                        );

                                        // icon
                                        form.add(
                                            'select2',
                                            {
                                                name: 'icon',
                                                label: self._builder.Locale.get('Icon'),
                                                placeholder: self._builder.Locale.get('Select an icon'),
                                                options: self.icons(),
                                                class: {
                                                    component: 'col-12 col-md-6',
                                                },
                                                callback:{
                                                    format: function(option, component){
                                                        if (!option.id) { return option.text; }
                                                        return $('<span class=""><i class="me-2 text-bg-light p-1 fs-4 rounded bi bi-' +  option.element.value.toLowerCase() + '"></i>' + option.text + '</span>');
                                                    },
                                                },
                                            }
                                        );

                                        // Create the task section
                                        self._component.grid.col2.task = $(document.createElement('div')).addClass('process-task').appendTo(tab);
                                        self._component.grid.col2.task.bar = $(document.createElement('div')).addClass('process-task-bar').appendTo(self._component.grid.col2.task);
                                        self._component.grid.col2.task.bar.title = $(document.createElement('h5')).text(self._builder.Locale.get('Task')).appendTo(self._component.grid.col2.task.bar);
                                        self._component.grid.col2.task.bar.badge = $(document.createElement('span')).attr({
                                            'class': 'badge text-bg-primary ms-2',
                                            'data-task': self._current.task,
                                        }).text('#'+self._current.task).appendTo(self._component.grid.col2.task.bar);
                                        self._component.grid.col2.task.bar.controls = $(document.createElement('div')).attr({
                                            'class': 'btn-group border rounded ms-auto',
                                        }).appendTo(self._component.grid.col2.task.bar);
                                        self._component.grid.col2.task.bar.controls.up = $(document.createElement('button')).attr({
                                            'type': 'button',
                                            'class': 'btn btn-light',
                                        }).html('<i class="bi bi-chevron-up"></i>').appendTo(self._component.grid.col2.task.bar.controls).click(function(){
                                            self.indexTasks((self._current.task - 1));
                                        });
                                        self._component.grid.col2.task.bar.controls.down = $(document.createElement('button')).attr({
                                            'type': 'button',
                                            'class': 'btn btn-light',
                                        }).html('<i class="bi bi-chevron-down"></i>').appendTo(self._component.grid.col2.task.bar.controls).click(function(){
                                            self.indexTasks((self._current.task + 1));
                                        });
                                        self._component.grid.col2.task.bar.controls.delete = $(document.createElement('button')).attr({
                                            'type': 'button',
                                            'class': 'btn btn-danger',
                                        }).html('<i class="bi bi-trash"></i>').appendTo(self._component.grid.col2.task.bar.controls).click(function(){
                                            self.deleteTask();
                                        });
                                        self._component.grid.col2.task.tree = $(document.createElement('div')).addClass('border-bottom p-3 py-2').appendTo(self._component.grid.col2.task);

                                        // Create the task form
                                        self._builder.Utility(
                                            'form',
                                            self._component.grid.col2.task.tree,
                                            {
                                                class: {
                                                    component: 'row g-3',
                                                },
                                                callback: {
                                                    val: function(values){
                                                        values.name = values.name ?? null;
                                                        values.description = values.description ?? null;
                                                        values.onComplete = values.onComplete ?? null;
                                                        values.value = values.value ?? null;
                                                        values.cost = parseInt(values.cost);
                                                        values.emphasize = values.emphasize ?? null;
                                                        return values;
                                                    },
                                                    submit: function(formTask){
                                                        for(const [key, value] of Object.entries(formTask.val())){
                                                            self._process[self._current.stage].tasks[self._current.task][key] = value;
                                                        }
                                                    },
                                                }
                                            },
                                            function(formTask,component){

                                                // Store the form
                                                self._component.grid.col2.task.form = formTask;

                                                // name
                                                formTask.add(
                                                    'text',
                                                    {
                                                        name: 'name',
                                                        label: self._builder.Locale.get('Name'),
                                                        placeholder: self._builder.Locale.get('Enter a name'),
                                                        class: {
                                                            component: 'col-12',
                                                        },
                                                    },
                                                    function(input){
                                                        input._component.input.attr({'rows': 5,'style': 'resize: none;'});
                                                    },
                                                );

                                                // description
                                                formTask.add(
                                                    'textarea',
                                                    {
                                                        name: 'description',
                                                        label: self._builder.Locale.get('Description'),
                                                        placeholder: self._builder.Locale.get('Enter a description'),
                                                        class: {
                                                            component: 'col-12',
                                                        },
                                                    },
                                                    function(input){
                                                        input._component.input.attr({'rows': 5,'style': 'resize: none;'});
                                                    },
                                                );

                                                // onComplete
                                                formTask.add(
                                                    'select2',
                                                    {
                                                        name: 'onComplete',
                                                        label: self._builder.Locale.get('Function'),
                                                        placeholder: self._builder.Locale.get('Select a funtion'),
                                                        options: self.functions(),
                                                        allowClear: true,
                                                        class: {
                                                            component: 'col-12 col-md-6',
                                                        },
                                                    }
                                                );

                                                // value
                                                formTask.add(
                                                    'text',
                                                    {
                                                        name: 'value',
                                                        label: self._builder.Locale.get('Value'),
                                                        placeholder: self._builder.Locale.get('Enter a value'),
                                                        class: {
                                                            component: 'col-12 col-md-6',
                                                        },
                                                    }
                                                );

                                                // cost
                                                formTask.add(
                                                    'number',
                                                    {
                                                        name: 'cost',
                                                        label: self._builder.Locale.get('Cost'),
                                                        placeholder: self._builder.Locale.get('Enter a cost (in minutes)'),
                                                        class: {
                                                            component: 'col-12 col-md-6',
                                                        },
                                                    },
                                                    function(input){
                                                        input._component.input.attr({
                                                            'step':'1',
                                                            'min':'0',
                                                        });
                                                    }
                                                );

                                                // emphasis
                                                formTask.add(
                                                    'text',
                                                    {
                                                        name: 'emphasize',
                                                        label: self._builder.Locale.get('Emphasis'),
                                                        placeholder: self._builder.Locale.get('Enter a CSS Selector'),
                                                        class: {
                                                            component: 'col-12 col-md-6',
                                                        },
                                                    }
                                                );

                                                // isDisabled
                                                formTask.add(
                                                    'switch',
                                                    {
                                                        name: 'isDisabled',
                                                        label: self._builder.Locale.get('Automated'),
                                                        class: {
                                                            component: 'col-12',
                                                        },
                                                    }
                                                );

                                                // Create the tasks section
                                                self._component.grid.col2.tasks = $(document.createElement('div')).addClass('process-tasks').appendTo(tab);
                                                self._component.grid.col2.tasks.bar = $(document.createElement('div')).addClass('process-tasks-bar').appendTo(self._component.grid.col2.tasks);
                                                self._component.grid.col2.tasks.bar.title = $(document.createElement('h5')).text(self._builder.Locale.get('Tasks')).appendTo(self._component.grid.col2.tasks.bar);
                                                self._component.grid.col2.tasks.bar.add = $(document.createElement('button')).attr({
                                                    'type': 'button',
                                                    'class': 'btn btn-success ms-auto',
                                                }).html('<i class="bi bi-plus-lg"></i>').appendTo(self._component.grid.col2.tasks.bar).click(function(){
                                                    self.addTask(self._current.stage);
                                                    self.render();
                                                });;
                                                self._component.grid.col2.tasks.tree = $(document.createElement('div')).addClass('process-tasks-tree').appendTo(self._component.grid.col2.tasks);

                                                // Render the stages
                                                for(const [order, stage] of Object.entries(self.data().record.process ?? {})){
                                                    self.addStage(stage);
                                                    if(Object.entries(self.data().record.process ?? {}).length === parseInt(order)){
                                                        self.render();
                                                    }
                                                }
                                            },
                                        );
                                    },
                                );
                            },
                        );

                        // Notes
                        if(self._data.extensions.includes('notes')){

                            // Add the tab
                            tabs.add(
                                'notes',
                                {
                                    icon: "stickies",
                                    label: builder.Locale.get("Notes"),
                                },
                                function(tab,nav){
                                    self._builder.Widget('notes',tab,{data: self._data.dependencies.notes ?? {},targetTable: 'processes',targetId: self._properties.data})
                                },
                            );
                        }

                        // Event
                        if(self._data.extensions.includes('event')){

                            // Add the Event tab
                            tabs.add(
                                'event',
                                {
                                    icon: "activity",
                                    label: builder.Locale.get("Activity"),
                                },
                                function(tab,nav){
                                    self._builder.Widget("events",tab,{data: self._data.dependencies.event ?? {},targetTable: 'processes',targetId: self._properties.data});
                                },
                            );
                        }

                        // Relationship
                        if(self._data.extensions.includes('relationship')){

                            // Create the Relationship widget
                            self._builder.Widget("related",self._component.grid.col1,{data: self._data.dependencies.relationship ?? {},targetTable: 'process',targetId: self._properties.data});
                        }
                    }
                );
            },
        });
    }

    save(callback = null){

        // Set Self
        const self = this;

        // Create the Modal
        this._builder.Component(
            "modal",
            {
                icon: "save",
                title: this._builder.Locale.get("Are you sure?"),
                body: this._builder.Locale.get("Do you want to save the changes to this process?"),
                color: 'success',
                callback: {
                    submit: function(element,modal){

                        // Show the modal spinner
                        modal.spinner(true);

                        // AJAX Request
                        $.ajax({
                            url: '/api/process/update?id='+self._properties.data,
                            headers: {'X-CSRF-Authorization': CSRF_KEY},
                            type: 'POST',dataType: 'json',
                            data: self._component.grid.meta.form.val(),
                            error: function(xhr, status, error) {
                                console.error('Error updating process:', error);
                            },
                            success: function(response) {

                                // Check if a callback is provided
                                if (typeof callback === 'function') {
                                    callback(response);
                                }

                                // Close the modal
                                modal.hide();
                            }
                        });
                    },
                },
            },
            function(modal,component){

                // Show the modal
                modal.show();
            },
        );
    }

    apply(callback = null){

        // Set Self
        const self = this;

        // Create the Modal
        this._builder.Component(
            "modal",
            {
                icon: "box-arrow-in-up",
                title: this._builder.Locale.get("Are you sure?"),
                body: this._builder.Locale.get("Do you want to apply the changes to existing tasks? This will update the tasks with the new process details. Although it may reset some of the progress."),
                color: 'warning',
                callback: {
                    submit: function(element,modal){

                        // Show the modal spinner
                        modal.spinner(true);

                        // AJAX Request
                        $.ajax({
                            url: '/api/tasks/upgrade?id=' + self._properties.data,
                            type: 'GET',dataType: 'json',
                            error: function(xhr, status, error) {
                                console.error('Error updating tasks:', error);
                            },
                            success: function(response) {

                                // Check if a callback is provided
                                if (typeof callback === 'function') {
                                    callback(response);
                                }

                                // Close the modal
                                modal.hide();
                            }
                        });
                    },
                },
            },
            function(modal,component){

                // Show the modal
                modal.show();
            },
        );
    }

    import(callback = null){}

    export(callback = null){}

    render(stage = null, task = 1){

        // Set Self
        const self = this;

        // Check if there are any stages
        if(Object.keys(this._process).length < 1){
            return;
        }

        // Set the current stage and task
        this._current.stage = parseInt(stage ?? this._current.stage);
        this._current.task = parseInt(task ?? this._current.task);

        // Check if the current stage is not lower than 1 and not higher than the number of stages
        this._current.stage = (this._current.stage < 1) ? 1 : this._current.stage;
        this._current.stage = (this._current.stage > Object.keys(this._process).length) ? Object.keys(this._process).length : this._current.stage;

        // Check if the current task is not lower than 1 and not higher than the number of tasks in the current stage
        this._current.task = (this._current.task < 1) ? 1 : this._current.task;
        this._current.task = (this._current.task > Object.keys(this._process[this._current.stage].tasks).length) ? Object.keys(this._process[this._current.stage].tasks).length : this._current.task;

        // Update the stage form
        if(this._component.grid.col2.stage.form){
            this._component.grid.col2.stage.form.val({
                name: this._process[this._current.stage].name ?? '',
                description: this._process[this._current.stage].description ?? '',
                color: this._process[this._current.stage].color ?? '',
                icon: this._process[this._current.stage].icon ?? '',
            });
        }

        // Update the stage badge
        if(this._component.grid.col2.stage.bar.badge){
            this._component.grid.col2.stage.bar.badge.attr({
                'data-stage': this._current.stage,
            }).text('#'+this._current.stage);
        }

        // Empty the stages tree
        this._component.grid.col1.stages.tree.empty();

        // Render the stages
        for(const [order, stage] of Object.entries(this._process)){
            this._stages[order].removeClass('active');
            this._stages[order].color.attr('class', 'process-stage-color text-bg-' + stage.color);
            this._stages[order].icon.attr('class', 'bi bi-' + stage.icon);
            this._stages[order].name.text(this._builder.Locale.get(stage.name));
            this._stages[order].count.text(Object.entries(stage.tasks).length);
            this._stages[order].appendTo(this._component.grid.col1.stages.tree).click(function(){
                self._component.grid.col2.stage.form.submit();
                self.render(order);
            });
        }

        // Update the task form
        if(this._component.grid.col2.task.form && typeof this._process[this._current.stage].tasks[this._current.task] !== 'undefined'){
            this._component.grid.col2.task.form.val({
                name: this._process[this._current.stage].tasks[this._current.task].name ?? '',
                description: this._process[this._current.stage].tasks[this._current.task].description ?? '',
                onComplete: this._process[this._current.stage].tasks[this._current.task].onComplete ?? '',
                value: this._process[this._current.stage].tasks[this._current.task].value ?? '',
                cost: this._process[this._current.stage].tasks[this._current.task].cost ?? '',
                emphasize: this._process[this._current.stage].tasks[this._current.task].emphasize ?? '',
                isDisabled: this._process[this._current.stage].tasks[this._current.task].isDisabled ?? false,
            });
        }

        // Update the task badge
        if(this._component.grid.col2.task.bar.badge){
            this._component.grid.col2.task.bar.badge.attr({
                'data-task': this._current.task,
            }).text('#'+this._current.task);
        }

        // Empty the tasks tree
        this._component.grid.col2.tasks.tree.empty();

        // Render the tasks
        for(const [order, task] of Object.entries(this._process[this._current.stage].tasks)){
            this._stages[this._current.stage].tasks[order].attr({
                'data-bs-title': this._builder.Locale.get(task.description),
            }).removeClass('active');
            this._stages[this._current.stage].tasks[order].meta.name.text(this._builder.Locale.get(task.name));
            this._stages[this._current.stage].tasks[order].meta.onComplete.html(task.onComplete ? ('<i class="bi bi-code-slash me-1"></i>' + task.onComplete.replace('process_function_', '') + ' ('+task.value+')') : '');
            this._stages[this._current.stage].tasks[order].cost.text(task.cost > 0 ? (task.cost + 'm') : '');
            this._stages[this._current.stage].tasks[order].appendTo(this._component.grid.col2.tasks.tree).click(function(){
                self._component.grid.col2.task.form.submit();
                self.render(self._current.stage, order);
            });
        }

        // Set the active stage
        this._stages[this._current.stage].addClass('active');

        // Set the active task
        if(typeof this._stages[this._current.stage].tasks[this._current.task] !== 'undefined'){
            this._stages[this._current.stage].tasks[this._current.task].addClass('active');
        }
    }

    addStage(data = {}, order = null){

        // Set Self
        const self = this;

        // Set default order if not provided
        order = order ?? Object.keys(this._stages).length + 1;

        // Set default stage
        const stage = {
            name: 'New Stage',
            description: 'Stage Description',
            color: 'teal',
            icon: 'list',
            isCompleted: false,
            tasks: {},
        };

        // Override default stage with provided data
        for(const [key, value] of Object.entries(data)){
            if(typeof stage[key] !== 'undefined'){
                stage[key] = value;
            }
        }

        // Sanitize booleans
        stage.isCompleted = (stage.isCompleted === true || stage.isCompleted === 1 || stage.isCompleted === '1' || stage.isCompleted === 'true') ? true : false;

        // Set the stage in the process data
        this._process[order] = stage;

        // Create a stage item
        this._stages[order] = $(document.createElement('div')).addClass('process-stage-item').appendTo(this._component.grid.col1.stages.tree);
        this._stages[order].color = $(document.createElement('div')).addClass('process-stage-color text-bg-'+stage.color).appendTo(this._stages[order]);
        this._stages[order].icon = $(document.createElement('i')).addClass('bi bi-'+stage.icon).appendTo(this._stages[order].color);
        this._stages[order].name = $(document.createElement('div')).addClass('process-stage-name').text(this._builder.Locale.get(stage.name)).appendTo(this._stages[order]);
        this._stages[order].count = $(document.createElement('div')).addClass('process-stage-count text-bg-primary').text(Object.entries(stage.tasks).length).appendTo(this._stages[order]);

        // Add a tasks property
        this._stages[order].tasks = {};

        // Create the tasks
        for(const [taskOrder, task] of Object.entries(stage.tasks)){
            this.addTask(order, task, taskOrder);
        }
    }

    addTask(stageOrder, data = {}, order = null){

        // Set default order if not provided
        order = order ?? Object.keys(this._stages[stageOrder].tasks).length + 1;

        // Set default task
        const task = {
            name: 'New Task',
            description: 'Task Description',
            isCompleted: false,
            isDisabled: false,
            onComplete: null,
            value: null,
            emphasize: null,
            cost: 0,
        };

        // Override default task with provided data
        for(const [key, value] of Object.entries(data)){
            if(typeof task[key] !== 'undefined'){
                task[key] = value;
            }
        }

        // Sanitize booleans
        task.isCompleted = (task.isCompleted === true || task.isCompleted === 1 || task.isCompleted === '1' || task.isCompleted === 'true') ? true : false;
        task.isDisabled = (task.isDisabled === true || task.isDisabled === 1 || task.isDisabled === '1' || task.isDisabled === 'true') ? true : false;

        // Set the task in the process data
        this._process[stageOrder].tasks[order] = task;

        // Create a task item
        this._stages[stageOrder].tasks[order] = $(document.createElement('div')).attr({
            'data-bs-toggle': 'tooltip',
            'data-bs-placement': 'top',
            'data-bs-title': this._builder.Locale.get(task.description),
        }).addClass('process-task-item');
        new bootstrap.Tooltip(this._stages[stageOrder].tasks[order][0]);
        this._stages[stageOrder].tasks[order].icon = $(document.createElement('i')).addClass('process-task-icon bi bi-square').appendTo(this._stages[stageOrder].tasks[order]);
        this._stages[stageOrder].tasks[order].meta = $(document.createElement('div')).addClass('process-task-meta').appendTo(this._stages[stageOrder].tasks[order]);
        this._stages[stageOrder].tasks[order].meta.name = $(document.createElement('div')).addClass('process-task-name').text(this._builder.Locale.get(task.name)).appendTo(this._stages[stageOrder].tasks[order].meta);
        this._stages[stageOrder].tasks[order].meta.onComplete = $(document.createElement('div')).addClass('process-task-function text-bg-info').html(task.onComplete ? ('<i class="bi bi-code-slash me-1"></i>' + task.onComplete.replace('process_function_', '') + ' ('+task.value+')') : '').appendTo(this._stages[stageOrder].tasks[order].meta);
        this._stages[stageOrder].tasks[order].cost = $(document.createElement('div')).addClass('process-task-cost text-bg-success').text(task.cost > 0 ? (task.cost + 'm') : '').appendTo(this._stages[stageOrder].tasks[order]);

    }

    data(data = null){
        if(data){
            this._data = data;
        }
        return this._data;
    }

    deleteStage(){

        // Check if there are any stages
        if(Object.keys(this._process).length < 1){
            return;
        }

        // Remove the stage from the process data
        delete this._process[this._current.stage];

        // Remove the stage element
        this._stages[this._current.stage].remove();
        delete this._stages[this._current.stage];

        // Re-index the stages
        this.indexStages();
    }

    deleteTask(){

        // Check if there are any tasks
        if(Object.keys(this._process[this._current.stage].tasks).length < 1){
            return;
        }

        // Remove the task from the process data
        delete this._process[this._current.stage].tasks[this._current.task];

        // Remove the task element
        this._stages[this._current.stage].tasks[this._current.task].remove();
        delete this._stages[this._current.stage].tasks[this._current.task];

        // Re-index the tasks
        this.indexTasks();
    }

    indexStages(index = null){

        // Check if there are any stages
        if(Object.keys(this._process).length < 1){
            return;
        }

        // Declare new process and stages
        var newProcess = {};
        var newStages = {};
        var count = 1;

        // Check if an index was provided
        if(index !== null){
            index = parseInt(index);
            index = (index < 1) ? 1 : index;
            index = (index > Object.keys(this._process).length) ? Object.keys(this._process).length : index;
            newProcess[index] = this._process[this._current.stage];
            newStages[index] = this._stages[this._current.stage];
        }

        // Loop through the current process
        for(const [order, stage] of Object.entries(this._process)){

            // Skip the current stage if an index was provided
            if(index !== null && order == this._current.stage){
                continue;
            }

            // Check if the stage is already in the new process
            if(typeof newProcess[count] !== 'undefined'){
                count++;
            }

            // Set the new order
            newProcess[count] = stage;
            newStages[count] = this._stages[order];

            // Increment the count
            count++;
        }

        // Set the new process and stages
        this._process = newProcess;
        this._stages = newStages;

        // Render the current stage
        this.render(index ?? this._current.stage);
    }

    indexTasks(index = null){

        // Bail if no stage or no tasks
        if (!this._process[this._current.stage] || !this._process[this._current.stage].tasks) {
            this.render(this._current.stage);
            return;
        }

        const stageOrder = this._current.stage;
        const tasksObj   = this._process[stageOrder].tasks;
        let entries      = Object.entries(tasksObj).sort((a,b) => Number(a[0]) - Number(b[0])); // [[key, task], ...]
        const count      = entries.length;

        // If there are no tasks left, normalize and render
        if (count === 0) {
            this._process[stageOrder].tasks = {};
            this._stages[stageOrder].tasks  = {};
            this._current.task = 0;
            this.render(stageOrder, 0);
            return;
        }

        // Build a parallel array of DOM elements in the same order as entries
        let elems = entries.map(([k]) => this._stages[stageOrder].tasks[k]).filter(Boolean);

        // If a target index is provided, move the current task there (1-based)
        if (index !== null) {
            index = parseInt(index, 10);
            index = Math.max(1, Math.min(index, count));            // clamp
            const curIdx = entries.findIndex(([k]) => Number(k) === this._current.task);

            if (curIdx !== -1 && curIdx !== (index - 1)) {
                // Move data row
                const moved = entries.splice(curIdx, 1)[0];
                entries.splice(index - 1, 0, moved);

                // Move corresponding element
                const movedEl = elems.splice(curIdx, 1)[0];
                elems.splice(index - 1, 0, movedEl);

                // Update current selection to its new index
                this._current.task = index;
            } else {
                // Even if no movement, ensure current is in bounds
                this._current.task = Math.max(1, Math.min(this._current.task, count));
            }
        } else {
            // Pure reindex after add/delete: keep the same relative selection, just clamp
            this._current.task = Math.max(1, Math.min(this._current.task, count));
        }

        // Rebuild sequential keys (1..n) for both data and element maps
        var newTasks = {};
        var newStageTasks = {};

        entries.forEach(([, task], i) => {
            const newKey = String(i + 1);
            newTasks[newKey] = task;

            const el = elems[i];
            if (el) {
                newStageTasks[newKey] = el;
            }
        });

        this._process[stageOrder].tasks = newTasks;
        this._stages[stageOrder].tasks  = newStageTasks;

        // Re-render with the (possibly) updated indexes
        this.render(stageOrder, this._current.task);
    }

    categories(){
        const array = [];
        for(const [key, value] of Object.entries(this.data().dependencies.categories ?? [])){
            array.push({id: value.name, text: value.name});
        }
        return array;
    }

    tables(){
        const array = [];
        for(const [key, value] of Object.entries(this.data().dependencies.tables ?? [])){
            array.push({id: value, text: value});
        }
        return array;
    }

    icons(){
        const array = [];
        for(const [key, value] of Object.entries(this._builder.Helper.bootstrapIcons())){
            array.push({id: value, text: value});
        }
        return array;
    }

    colors(){
        const array = [];
        for(const [key, value] of Object.entries(this._builder.Helper.bootstrapTextBg())){
            array.push({id: value, text: value});
        }
        return array;
    }

    functions(){
        const self = this;
        const array = [];
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
                        console.error("Invalid function["+name+"] metadata: "+required);
                        invalid = true;
                        break;
                    }
                }
                if(invalid){
                    continue;
                }
                // Add the function to the list
                var text = self._builder.Locale.get(metadata.label)
                if(typeof metadata.description !== 'undefined' && metadata.description !== null && metadata.description !== metadata.label){
                    text += ' - '+self._builder.Locale.get(metadata.description);
                }
                array.push({id: name, text: text});
            }
        }
        return array;
    }
})
