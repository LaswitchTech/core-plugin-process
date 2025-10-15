// Open URL
function process_function_openURL(task, value, callback = null){

    // Open the URL in a new tab
    window.open(value, '_blank');

    // Execute Callback
    if(typeof callback === "function"){
        callback(task, {status: 'success'});
    }
}
function process_meta_openURL(key = null){
    const metadata = {
        label: "Open an URL",
        description: "Open an URL",
        type: "none",
    };
    return metadata[key] ? metadata[key] : metadata;
}

// Request Confirmation from User
function process_function_requestConfirmation(task, value, callback = null){

    // Create the Modal
    builder.Component(
        "modal",
        {
            icon: "question-circle",
            title: builder.Locale.get("Confirm"),
            body: builder.Locale.get(value),
            color: 'info',
            callback: {
                submit: function(element,modal){

                    // Show the modal spinner
                    modal.spinner(true);

                    // Execute Callback
                    if(typeof callback === "function"){
                        callback(task, {status: 'success'});
                    }

                    // Close the modal
                    modal.hide();
                },
            },
        },
        function(modal,component){

            // Show the modal
            modal.show();
        },
    );
}
function process_meta_requestConfirmation(key = null){
    const metadata = {
        label: "Request Confirmation",
        description: "Request Confirmation from User",
        type: "none",
    };
    return metadata[key] ? metadata[key] : metadata;
}
