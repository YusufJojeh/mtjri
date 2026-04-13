<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Country;
use App\Models\State;
use App\Models\City;

class LocationSeeder extends Seeder
{
    public function run(): void
    {
        if (config('app.is_demo')) {
            $this->createDemoLocations();
        } else {
            $this->createMainVersionLocations();
        }
    }

    private function createDemoLocations()
    {
        // Create USA
        $usa = Country::firstOrCreate([
            'name' => 'United States',
            'code' => 'US',
            'status' => true
        ]);

        $california = State::firstOrCreate([
            'country_id' => $usa->id,
            'name' => 'California',
            'code' => 'CA',
            'status' => true
        ]);

        $texas = State::firstOrCreate([
            'country_id' => $usa->id,
            'name' => 'Texas',
            'code' => 'TX',
            'status' => true
        ]);

        City::firstOrCreate(['state_id' => $california->id, 'name' => 'Los Angeles', 'status' => true]);
        City::firstOrCreate(['state_id' => $california->id, 'name' => 'San Francisco', 'status' => true]);
        City::firstOrCreate(['state_id' => $california->id, 'name' => 'San Diego', 'status' => true]);
        City::firstOrCreate(['state_id' => $california->id, 'name' => 'Sacramento', 'status' => true]);
        City::firstOrCreate(['state_id' => $texas->id, 'name' => 'Houston', 'status' => true]);
        City::firstOrCreate(['state_id' => $texas->id, 'name' => 'Dallas', 'status' => true]);
        City::firstOrCreate(['state_id' => $texas->id, 'name' => 'Austin', 'status' => true]);
        City::firstOrCreate(['state_id' => $texas->id, 'name' => 'San Antonio', 'status' => true]);

        // Create India
        $india = Country::firstOrCreate([
            'name' => 'India',
            'code' => 'IN',
            'status' => true
        ]);

        $maharashtra = State::firstOrCreate([
            'country_id' => $india->id,
            'name' => 'Maharashtra',
            'code' => 'MH',
            'status' => true
        ]);

        $gujarat = State::firstOrCreate([
            'country_id' => $india->id,
            'name' => 'Gujarat',
            'code' => 'GJ',
            'status' => true
        ]);

        City::firstOrCreate(['state_id' => $maharashtra->id, 'name' => 'Mumbai', 'status' => true]);
        City::firstOrCreate(['state_id' => $maharashtra->id, 'name' => 'Pune', 'status' => true]);
        City::firstOrCreate(['state_id' => $maharashtra->id, 'name' => 'Nagpur', 'status' => true]);
        City::firstOrCreate(['state_id' => $maharashtra->id, 'name' => 'Nashik', 'status' => true]);
        City::firstOrCreate(['state_id' => $gujarat->id, 'name' => 'Ahmedabad', 'status' => true]);
        City::firstOrCreate(['state_id' => $gujarat->id, 'name' => 'Surat', 'status' => true]);
        City::firstOrCreate(['state_id' => $gujarat->id, 'name' => 'Vadodara', 'status' => true]);
        City::firstOrCreate(['state_id' => $gujarat->id, 'name' => 'Rajkot', 'status' => true]);

        // Create United Kingdom
        $uk = Country::firstOrCreate([
            'name' => 'United Kingdom',
            'code' => 'GB',
            'status' => true
        ]);

        $england = State::firstOrCreate([
            'country_id' => $uk->id,
            'name' => 'England',
            'code' => 'ENG',
            'status' => true
        ]);

        $scotland = State::firstOrCreate([
            'country_id' => $uk->id,
            'name' => 'Scotland',
            'code' => 'SCT',
            'status' => true
        ]);

        City::firstOrCreate(['state_id' => $england->id, 'name' => 'London', 'status' => true]);
        City::firstOrCreate(['state_id' => $england->id, 'name' => 'Manchester', 'status' => true]);
        City::firstOrCreate(['state_id' => $england->id, 'name' => 'Birmingham', 'status' => true]);
        City::firstOrCreate(['state_id' => $england->id, 'name' => 'Liverpool', 'status' => true]);
        City::firstOrCreate(['state_id' => $scotland->id, 'name' => 'Edinburgh', 'status' => true]);
        City::firstOrCreate(['state_id' => $scotland->id, 'name' => 'Glasgow', 'status' => true]);
        City::firstOrCreate(['state_id' => $scotland->id, 'name' => 'Aberdeen', 'status' => true]);
        City::firstOrCreate(['state_id' => $scotland->id, 'name' => 'Dundee', 'status' => true]);

        // Create Canada
        $canada = Country::firstOrCreate(['name' => 'Canada', 'code' => 'CA', 'status' => true]);
        $ontario = State::firstOrCreate(['country_id' => $canada->id, 'name' => 'Ontario', 'code' => 'ON', 'status' => true]);
        $quebec = State::firstOrCreate(['country_id' => $canada->id, 'name' => 'Quebec', 'code' => 'QC', 'status' => true]);
        City::firstOrCreate(['state_id' => $ontario->id, 'name' => 'Toronto', 'status' => true]);
        City::firstOrCreate(['state_id' => $ontario->id, 'name' => 'Ottawa', 'status' => true]);
        City::firstOrCreate(['state_id' => $ontario->id, 'name' => 'Hamilton', 'status' => true]);
        City::firstOrCreate(['state_id' => $ontario->id, 'name' => 'London', 'status' => true]);
        City::firstOrCreate(['state_id' => $quebec->id, 'name' => 'Montreal', 'status' => true]);
        City::firstOrCreate(['state_id' => $quebec->id, 'name' => 'Quebec City', 'status' => true]);
        City::firstOrCreate(['state_id' => $quebec->id, 'name' => 'Laval', 'status' => true]);
        City::firstOrCreate(['state_id' => $quebec->id, 'name' => 'Gatineau', 'status' => true]);

        // Create Australia
        $australia = Country::firstOrCreate(['name' => 'Australia', 'code' => 'AU', 'status' => true]);
        $nsw = State::firstOrCreate(['country_id' => $australia->id, 'name' => 'New South Wales', 'code' => 'NSW', 'status' => true]);
        $victoria = State::firstOrCreate(['country_id' => $australia->id, 'name' => 'Victoria', 'code' => 'VIC', 'status' => true]);
        City::firstOrCreate(['state_id' => $nsw->id, 'name' => 'Sydney', 'status' => true]);
        City::firstOrCreate(['state_id' => $nsw->id, 'name' => 'Newcastle', 'status' => true]);
        City::firstOrCreate(['state_id' => $nsw->id, 'name' => 'Wollongong', 'status' => true]);
        City::firstOrCreate(['state_id' => $nsw->id, 'name' => 'Central Coast', 'status' => true]);
        City::firstOrCreate(['state_id' => $victoria->id, 'name' => 'Melbourne', 'status' => true]);
        City::firstOrCreate(['state_id' => $victoria->id, 'name' => 'Geelong', 'status' => true]);
        City::firstOrCreate(['state_id' => $victoria->id, 'name' => 'Ballarat', 'status' => true]);
        City::firstOrCreate(['state_id' => $victoria->id, 'name' => 'Bendigo', 'status' => true]);

        // Create Germany
        $germany = Country::firstOrCreate(['name' => 'Germany', 'code' => 'DE', 'status' => true]);
        $bavaria = State::firstOrCreate(['country_id' => $germany->id, 'name' => 'Bavaria', 'code' => 'BY', 'status' => true]);
        $nrw = State::firstOrCreate(['country_id' => $germany->id, 'name' => 'North Rhine-Westphalia', 'code' => 'NW', 'status' => true]);
        City::firstOrCreate(['state_id' => $bavaria->id, 'name' => 'Munich', 'status' => true]);
        City::firstOrCreate(['state_id' => $bavaria->id, 'name' => 'Nuremberg', 'status' => true]);
        City::firstOrCreate(['state_id' => $bavaria->id, 'name' => 'Augsburg', 'status' => true]);
        City::firstOrCreate(['state_id' => $bavaria->id, 'name' => 'Regensburg', 'status' => true]);
        City::firstOrCreate(['state_id' => $nrw->id, 'name' => 'Cologne', 'status' => true]);
        City::firstOrCreate(['state_id' => $nrw->id, 'name' => 'Düsseldorf', 'status' => true]);
        City::firstOrCreate(['state_id' => $nrw->id, 'name' => 'Dortmund', 'status' => true]);
        City::firstOrCreate(['state_id' => $nrw->id, 'name' => 'Essen', 'status' => true]);

        // Create France
        $france = Country::firstOrCreate(['name' => 'France', 'code' => 'FR', 'status' => true]);
        $iledefrance = State::firstOrCreate(['country_id' => $france->id, 'name' => 'Île-de-France', 'code' => 'IDF', 'status' => true]);
        $provence = State::firstOrCreate(['country_id' => $france->id, 'name' => 'Provence-Alpes-Côte d\'Azur', 'code' => 'PAC', 'status' => true]);
        City::firstOrCreate(['state_id' => $iledefrance->id, 'name' => 'Paris', 'status' => true]);
        City::firstOrCreate(['state_id' => $iledefrance->id, 'name' => 'Versailles', 'status' => true]);
        City::firstOrCreate(['state_id' => $iledefrance->id, 'name' => 'Boulogne-Billancourt', 'status' => true]);
        City::firstOrCreate(['state_id' => $iledefrance->id, 'name' => 'Saint-Denis', 'status' => true]);
        City::firstOrCreate(['state_id' => $provence->id, 'name' => 'Marseille', 'status' => true]);
        City::firstOrCreate(['state_id' => $provence->id, 'name' => 'Nice', 'status' => true]);
        City::firstOrCreate(['state_id' => $provence->id, 'name' => 'Toulon', 'status' => true]);
        City::firstOrCreate(['state_id' => $provence->id, 'name' => 'Aix-en-Provence', 'status' => true]);

        // Create Japan
        $japan = Country::firstOrCreate(['name' => 'Japan', 'code' => 'JP', 'status' => true]);
        $tokyo = State::firstOrCreate(['country_id' => $japan->id, 'name' => 'Tokyo', 'code' => 'TK', 'status' => true]);
        $osaka = State::firstOrCreate(['country_id' => $japan->id, 'name' => 'Osaka', 'code' => 'OS', 'status' => true]);
        City::firstOrCreate(['state_id' => $tokyo->id, 'name' => 'Shibuya', 'status' => true]);
        City::firstOrCreate(['state_id' => $tokyo->id, 'name' => 'Shinjuku', 'status' => true]);
        City::firstOrCreate(['state_id' => $tokyo->id, 'name' => 'Harajuku', 'status' => true]);
        City::firstOrCreate(['state_id' => $tokyo->id, 'name' => 'Ginza', 'status' => true]);
        City::firstOrCreate(['state_id' => $osaka->id, 'name' => 'Osaka City', 'status' => true]);
        City::firstOrCreate(['state_id' => $osaka->id, 'name' => 'Sakai', 'status' => true]);
        City::firstOrCreate(['state_id' => $osaka->id, 'name' => 'Higashiosaka', 'status' => true]);
        City::firstOrCreate(['state_id' => $osaka->id, 'name' => 'Hirakata', 'status' => true]);

        // Create Brazil
        $brazil = Country::firstOrCreate(['name' => 'Brazil', 'code' => 'BR', 'status' => true]);
        $saopaulo = State::firstOrCreate(['country_id' => $brazil->id, 'name' => 'São Paulo', 'code' => 'SP', 'status' => true]);
        $riodejaneiro = State::firstOrCreate(['country_id' => $brazil->id, 'name' => 'Rio de Janeiro', 'code' => 'RJ', 'status' => true]);
        City::firstOrCreate(['state_id' => $saopaulo->id, 'name' => 'São Paulo', 'status' => true]);
        City::firstOrCreate(['state_id' => $saopaulo->id, 'name' => 'Campinas', 'status' => true]);
        City::firstOrCreate(['state_id' => $saopaulo->id, 'name' => 'Santos', 'status' => true]);
        City::firstOrCreate(['state_id' => $saopaulo->id, 'name' => 'São Bernardo do Campo', 'status' => true]);
        City::firstOrCreate(['state_id' => $riodejaneiro->id, 'name' => 'Rio de Janeiro', 'status' => true]);
        City::firstOrCreate(['state_id' => $riodejaneiro->id, 'name' => 'Niterói', 'status' => true]);
        City::firstOrCreate(['state_id' => $riodejaneiro->id, 'name' => 'Nova Iguaçu', 'status' => true]);
        City::firstOrCreate(['state_id' => $riodejaneiro->id, 'name' => 'Duque de Caxias', 'status' => true]);

        // Create Italy
        $italy = Country::firstOrCreate(['name' => 'Italy', 'code' => 'IT', 'status' => true]);
        $lazio = State::firstOrCreate(['country_id' => $italy->id, 'name' => 'Lazio', 'code' => 'LZ', 'status' => true]);
        $lombardy = State::firstOrCreate(['country_id' => $italy->id, 'name' => 'Lombardy', 'code' => 'LM', 'status' => true]);
        City::firstOrCreate(['state_id' => $lazio->id, 'name' => 'Rome', 'status' => true]);
        City::firstOrCreate(['state_id' => $lazio->id, 'name' => 'Latina', 'status' => true]);
        City::firstOrCreate(['state_id' => $lazio->id, 'name' => 'Frosinone', 'status' => true]);
        City::firstOrCreate(['state_id' => $lazio->id, 'name' => 'Viterbo', 'status' => true]);
        City::firstOrCreate(['state_id' => $lombardy->id, 'name' => 'Milan', 'status' => true]);
        City::firstOrCreate(['state_id' => $lombardy->id, 'name' => 'Brescia', 'status' => true]);
        City::firstOrCreate(['state_id' => $lombardy->id, 'name' => 'Bergamo', 'status' => true]);
        City::firstOrCreate(['state_id' => $lombardy->id, 'name' => 'Monza', 'status' => true]);

        // Create Spain
        $spain = Country::firstOrCreate(['name' => 'Spain', 'code' => 'ES', 'status' => true]);
        $madrid = State::firstOrCreate(['country_id' => $spain->id, 'name' => 'Madrid', 'code' => 'MD', 'status' => true]);
        $catalonia = State::firstOrCreate(['country_id' => $spain->id, 'name' => 'Catalonia', 'code' => 'CT', 'status' => true]);
        City::firstOrCreate(['state_id' => $madrid->id, 'name' => 'Madrid', 'status' => true]);
        City::firstOrCreate(['state_id' => $madrid->id, 'name' => 'Alcalá de Henares', 'status' => true]);
        City::firstOrCreate(['state_id' => $madrid->id, 'name' => 'Móstoles', 'status' => true]);
        City::firstOrCreate(['state_id' => $madrid->id, 'name' => 'Fuenlabrada', 'status' => true]);
        City::firstOrCreate(['state_id' => $catalonia->id, 'name' => 'Barcelona', 'status' => true]);
        City::firstOrCreate(['state_id' => $catalonia->id, 'name' => 'Hospitalet de Llobregat', 'status' => true]);
        City::firstOrCreate(['state_id' => $catalonia->id, 'name' => 'Badalona', 'status' => true]);
        City::firstOrCreate(['state_id' => $catalonia->id, 'name' => 'Terrassa', 'status' => true]);

        // Create Netherlands
        $netherlands = Country::firstOrCreate(['name' => 'Netherlands', 'code' => 'NL', 'status' => true]);
        $noordholland = State::firstOrCreate(['country_id' => $netherlands->id, 'name' => 'North Holland', 'code' => 'NH', 'status' => true]);
        $zuidholland = State::firstOrCreate(['country_id' => $netherlands->id, 'name' => 'South Holland', 'code' => 'ZH', 'status' => true]);
        City::firstOrCreate(['state_id' => $noordholland->id, 'name' => 'Amsterdam', 'status' => true]);
        City::firstOrCreate(['state_id' => $noordholland->id, 'name' => 'Haarlem', 'status' => true]);
        City::firstOrCreate(['state_id' => $noordholland->id, 'name' => 'Zaanstad', 'status' => true]);
        City::firstOrCreate(['state_id' => $noordholland->id, 'name' => 'Haarlemmermeer', 'status' => true]);
        City::firstOrCreate(['state_id' => $zuidholland->id, 'name' => 'The Hague', 'status' => true]);
        City::firstOrCreate(['state_id' => $zuidholland->id, 'name' => 'Rotterdam', 'status' => true]);
        City::firstOrCreate(['state_id' => $zuidholland->id, 'name' => 'Leiden', 'status' => true]);
        City::firstOrCreate(['state_id' => $zuidholland->id, 'name' => 'Dordrecht', 'status' => true]);
    }

    private function createMainVersionLocations()
    {
        // Create only 2 countries for main version
        $usa = Country::firstOrCreate([
            'name' => 'United States',
            'code' => 'US',
            'status' => true
        ]);

        $india = Country::firstOrCreate([
            'name' => 'India',
            'code' => 'IN',
            'status' => true
        ]);

        // Create 4 states (2 per country)
        $california = State::firstOrCreate([
            'country_id' => $usa->id,
            'name' => 'California',
            'code' => 'CA',
            'status' => true
        ]);

        $texas = State::firstOrCreate([
            'country_id' => $usa->id,
            'name' => 'Texas',
            'code' => 'TX',
            'status' => true
        ]);

        $maharashtra = State::firstOrCreate([
            'country_id' => $india->id,
            'name' => 'Maharashtra',
            'code' => 'MH',
            'status' => true
        ]);

        $gujarat = State::firstOrCreate([
            'country_id' => $india->id,
            'name' => 'Gujarat',
            'code' => 'GJ',
            'status' => true
        ]);

        // Create 8 cities (2 per state)
        City::firstOrCreate(['state_id' => $california->id, 'name' => 'Los Angeles', 'status' => true]);
        City::firstOrCreate(['state_id' => $california->id, 'name' => 'San Francisco', 'status' => true]);
        City::firstOrCreate(['state_id' => $texas->id, 'name' => 'Houston', 'status' => true]);
        City::firstOrCreate(['state_id' => $texas->id, 'name' => 'Dallas', 'status' => true]);
        City::firstOrCreate(['state_id' => $maharashtra->id, 'name' => 'Mumbai', 'status' => true]);
        City::firstOrCreate(['state_id' => $maharashtra->id, 'name' => 'Pune', 'status' => true]);
        City::firstOrCreate(['state_id' => $gujarat->id, 'name' => 'Ahmedabad', 'status' => true]);
        City::firstOrCreate(['state_id' => $gujarat->id, 'name' => 'Surat', 'status' => true]);

        $this->command->info('Created 2 countries, 4 states, and 8 cities for main version.');
    }
}
