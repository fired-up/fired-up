const fs = require('fs');
const { eachLimit } = require('async');
const parse = require('csv-parse');

const BATCH_SIZE = 500;

/**
 * Initialize this code with the `new` keyword
 */
module.exports = function(filename) {
  /**
   * Read a single row from the import CSV
   * @param {int} rowNumber The row number to read from the CSV file
   * @param {array<int>} cols An array containing column names
   */
  this.readRow = (rowNumber, cols) => {
    const csvStream = fs.createReadStream(filename);

    return new Promise((resolve, reject) => {
      let row;

      const parser = csvStream
        .pipe(
          parse({
            to_line: rowNumber + 1,
            columns: cols || null,
            from_line:
              typeof rowNumber === 'number' && rowNumber > 0
                ? rowNumber
                : undefined, // required to access row 0 (cols)
          })
        )
        .on('data', record => {
          row = record;
        })
        .on('error', error => {
          console.error(error);
        })
        .on('end', () => {
          resolve(row);
        });
    });
  };

  /**
   * Read multiple rows from the import CSV
   * @param {int} count Number of rows to read
   * @param {int} offset How many counts we are from beginning of file
   * @param {array<int>} cols An array containing column names
   */
  this.readRows = (count, offset, cols) => {
    const csvStream = fs.createReadStream(filename);

    return new Promise((resolve, reject) => {
      let rows = [];

      let start = offset * count + 2;

      const parser = csvStream
        .pipe(
          parse({
            to: BATCH_SIZE,
            from_line: start,
            columns: cols || null,
          })
        )
        .on('data', row => {
          rows.push(row);
        })
        .on('error', error => {
          console.error(error);
        })
        .on('end', () => {
          resolve(rows);
        });
    });
  };

  this.processCSV = rowHandler => {
    return new Promise(async (resolve, reject) => {
      let iteration = 0;
      let lastCount = BATCH_SIZE;

      let count = 0;
      const errors = [];
      const cols = await this.readRow(0);

      do {
        const startingRowNumber = iteration * BATCH_SIZE;
        const rows = await this.readRows(BATCH_SIZE, iteration, cols);

        console.log(
          `    Processing rows ${startingRowNumber} - ${startingRowNumber +
            BATCH_SIZE}`
        );

        await new Promise(resolve => {
          eachLimit(
            rows,
            25,
            async (row, callback) => {
              try {
                await rowHandler(row, count);
              } catch (error) {
                errors.push({
                  row: count,
                  message: error.message,
                });
              }

              count++;
              return;
            },
            resolve
          );
        });

        iteration++;
        lastCount = rows.length;
      } while (lastCount >= BATCH_SIZE - 1);

      resolve({
        errors,
        rowsProcessed: count,
        errorsEncountered: errors.length,
      });
    });
  };
};
