<?php

/**
 * Core Framework - ProcessEndpoint
 *
 * @license    MIT (https://mit-license.org/)
 * @author     Louis Ouellet <louis@laswitchtech.com>
 */

// Import additionnal class into the global namespace
use \LaswitchTech\Core\Objects;
use \LaswitchTech\Core\Abstracts\Endpoint;

class ProcessEndpoint extends Endpoint {

    /**
     * Constructor
     */
    public function __construct()
    {

        // Call Parent Constructor
        parent::__construct();

        // Retrieve the namespace
        $namespace = $this->Request->getNamespace();

        // Set Global access
        $this->Public = false;

        // Set Properties
        switch($namespace){
            case "/process/index":
            case "/process/fetch":
            case "/process/meta":
                $this->Level = 1;
                break;
            case "/process/create":
                $this->Level = 2;
                break;
            case "/process/update":
                $this->Level = 3;
                break;
            case "/process/delete":
                $this->Level = 4;
                break;
        }
    }

    /**
     * Fetch all processs
     */
    public function indexAction(): array
    {
        // Set the default message
        $message = ["status" => 200, "message" => "OK", "data" => $this->Model->Process->fetchAll()];

        // Return the message
        return $message;
    }

    /**
     * Get a processs
     */
    public function fetchAction(): array
    {
        // Set the default message
        $message = ["status" => 200, "message" => "OK", "data" => $this->Model->Process->fetch(intval($this->Request->getParams('GET', 'id')))];

        // Return the message
        return $message;
    }

    /**
     * Get the required metadata for a process
     */
    public function metaAction(): array
    {
        // Set the default message
        $message = ["status" => 200, "message" => "OK", "data" => $this->Model->Process->meta()];

        // Return the message
        return $message;
    }

    /**
     * Create a processs
     */
    public function createAction(): array
    {
        // Set the default message
        $message = ["status" => 200, "message" => "OK", "data" => []];

        // Return the message
        return $message;
    }

    /**
     * Update a processs
     */
    public function updateAction(): array
    {
        // Import Global Variables
        global $CSRF;

        // Set the default message
        $message = ["status" => 200, "message" => "OK", "data" => []];

        // Check the request method
        if($this->Request->getMethod() == "POST"){
            $message["data"]["CSRF"] = [
                "token" => $CSRF->token(),
                "key" => $CSRF->key()
            ];
        }

        // Retrieve the process id
        $id = intval($this->Request->getParams('REQUEST','id'));

        // Retrieve the process
        $process = $this->Model->Process->fetch($id);

        // Check if the task exists
        if(empty($process)){
            $message = ["status" => 404, "message" => "Not Found", "data" => "Could not find the requested task."];
        }

        // Check if the task is accessible
        if($message['status'] == 200){

            // Check the request method
            if($this->Request->getMethod() == "POST"){

                // Retrieve the due date
                $changes = $this->Request->getParams('REQUEST');

                // Set the changes
                $message['data']["affectedRows"] = $this->Model->Process->update($id, $changes);

                // Set the updated process
                $message['data']["record"] = $this->Model->Process->fetch($id);
            } else {
                $message = ["status" => 405, "message" => "Method Not Allowed", "data" => "The method is not allowed for the requested URL."];
            }
        }

        // Return the message
        return $message;
    }

    /**
     * Delete a processs
     */
    public function deleteAction(): array
    {
        // Set the default message
        $message = ["status" => 200, "message" => "OK", "data" => []];

        // Return the message
        return $message;
    }
}
