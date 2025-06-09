<?php

/**
 * Core Framework - ProcessModel
 *
 * @license    MIT (https://mit-license.org/)
 * @author     Louis Ouellet <louis@laswitchtech.com>
 */

// Import additionnal class into the global namespace
use \LaswitchTech\Core\Abstracts\Model;

class ProcessModel extends Model {

    /**
     * Retrieve all the processes
     *
     * @return array
     */
    public function fetchAll(): array
    {
        // Create the Query
        $Query = $this->Database->query()
            ->table('processes')
            ->select('*')
            ->join('owner', 'users', 'username')
            ->filter()
            ->where('id', 9999, '<>');

        // Retrieve the Results
        $result = $Query->result();

        // Decode JSON Fields
        foreach($result as $key => $record){
            $result[$key]['process'] = json_decode($record['process'] ?? '[]', true);
        }

        // Return the Results
        return $result;
    }

    /**
     * Retrieve a process by ID
     *
     * @return array
     */
    public function fetch(int $id): array
    {
        // Create the Query
        $Query = $this->Database->query()
            ->table('processes')
            ->select('*')
            ->join('owner', 'users', 'username')
            ->limit(1)
            ->filter()
            ->where('id', 9999, '<>')
            ->where('id', $id);

        // Retrieve the Results
        $result = $Query->result();

        // Decode JSON Fields
        foreach($result as $key => $record){
            $result[$key]['process'] = json_decode($record['process'] ?? '[]', true);
        }

        // Return the Results
        return $result[array_key_first($result)] ?? [];
    }

    /**
     * Retrieve metadata for a process
     *
     * @return array
     */
    public function meta(): array
    {
        // Initialize the options
        $options = [
            "targetTable" => [],
            "category" => [],
        ];

        // Loop through all the tables
        foreach($this->Database->schema()->tables() as $table){
            $options['targetTable'][] = ["id" => $table, "text" => ucwords($table)];
        }

        // Create the Query
        $Query = $this->Database->query()
            ->table('categories')
            ->select('*')
            ->filter()
            ->where('id', 9999, '<>')
            ->where('targetTable', 'processes');

        // Retrieve the Results
        $result = $Query->fetch();

        // Loop through all the categories
        foreach($result as $key => $record){
            $options['category'][] = ["id" => $record['name'], "text" => ucwords($record['name'])];
        }

        // Return the options
        return $options;
    }

    /**
     * Retrieve the first process associated with a table
     *
     * @param string $category
     * @return array
     */
    public function get(string $category): array
    {
        // Initialize the Result
        $result = [];

        // Create the Query
        $Query = $this->Database->query()
            ->table('processes')
            ->select('*')
            ->limit(1)
            ->where('id', 9999, '<>')
            ->where('category', $category);

        // Retrieve the Results
        $result = $Query->fetch();

        // Decode JSON Fields
        foreach($result as $key => $record){
            $result[$key]['process'] = json_decode($record['process'] ?? '[]', true);
        }

        // Return the first Result
        return $result[0] ?? [];
    }

    /**
     * Create a new Process and return the id
     *
     * @param array $data
     * @return int
     */
    public function create(array $data): int
    {
        // Create the Query
        $Query = $this->Database->query()
            ->table('processes')
            ->insert($data);

        // Execute the Query
        $affectedRows = $Query->execute();

        // Execute the Query
        return $Query->lastId();
    }

    /**
     * Update a Process
     *
     * @param int $id
     * @param array $data
     * @return int
     */
    public function update(int $id, array $data): int
    {
        // Create the Query
        $Query = $this->Database->query()
            ->table('processes')
            ->update($data)
            ->where('id', $id);

        // Execute the Query
        return $Query->execute();
    }
}
