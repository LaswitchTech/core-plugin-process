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
            'class': '',
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
                                                class: 'rounded border-0 my-1',
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
                    task.addClass('cursor-not-allowed bg-transparent');
                    self.#exec(stepOrder, taskOrder, taskData.onComplete);
                    if(!self._initialized && taskData.emphasize){
                        task.click(function(e){
                            e.preventDefault();
                            e.stopPropagation();
                            self.#emphasize(stepOrder, taskOrder, taskData.emphasize);
                        });
                    }
                } else {
                    task.addClass('cursor-pointer text-bg-gray-200');
                    task.hover(function(){
                        $(this).removeClass('text-bg-gray-200').addClass('text-bg-gray-300');
                    }, function(){
                        $(this).removeClass('text-bg-gray-300').addClass('text-bg-gray-200');
                    });
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
                    task.removeClass('cursor-not-allowed cursor-pointer bg-transparent text-bg-gray-200').addClass('text-bg-success');
                    task.off('click').off('hover');
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
                        }
                        self.save();
                    });
                } else {
                    this._task.process[step].tasks[task].isCompleted = true;
                    if(tasksLength === parseInt(task)){
                        this._task.process[step].isCompleted = true;
                        this._task.progress = (parseInt(step) + 1);
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
