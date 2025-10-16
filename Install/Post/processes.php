<?php

require_once __DIR__ . '/../Model.php';

class ProcessesPostModel extends ProcessModel {

    /**
     * Post process a record
     *
     * @param array $record
     * @return array
     */
    public function post($record): array
    {
        // Check if the record ID is below 9999
        if($record['id'] > 9999) return $record;

        return [];
    }
}
