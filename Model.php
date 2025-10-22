<?php

// Import additionnal class into the global namespace
use \LaswitchTech\Core\Base\BaseModel;

class ProcessModel extends BaseModel {

    /**
     * Constructor
     */
    public function __construct()
    {
        // Call the parent constructor
        parent::__construct();

        // Initialize the Model
        $this->init('processes');
    }

    /**
     * Process a record
     *
     * @param array $record
     * @return array
     */
    protected function process(array $record): array
    {
        // Call the parent constructor
        $record = parent::process($record);

        // Decode the process
        if(!is_array($record['process'])){
            $record['process'] = json_decode($record['process'] ?? "[]", true);
        }

        // Return the processed record
        return $record;
    }

    /**
     * Retrieve a single record by target Table
     *
     * @param string $table
     * @param string|null $category
     * @return array
     */
    public function fetchByTable(string $table, ?string $category = null): array
    {
        // Create the Query
        $Query = $this->Database->query()
            ->table($this->table)
            ->select('*')
            ->join('owner', 'users', 'username')
            ->order('id', 'DESC')
            ->filter()
            ->where('id', 9999, '<>')
            ->filter()
            ->where('targetTable', $table)
            ->limit(1);

        // Check if a category is provided
        if($category && !empty($category)){

            // Add the category condition
            $Query->where('category', $category);
        }

        // Retrieve the record
        $records = $Query->fetch();

        // Loop through the records to process them
        foreach($records as $key => $record){

            // Overwrite the record with the processed one
            $records[$key] = $this->process($record);
        }

        // Return the record or an empty array if not found
        return $records[array_key_first($records)] ?? [];
    }
}
