import json
import os
import psycopg2
from datetime import datetime, date

def handler(event: dict, context) -> dict:
    """API для управления слотами времени записи"""
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    
    try:
        if method == 'GET':
            cur.execute("""
                SELECT id, slot_date, slot_time, is_available 
                FROM time_slots 
                WHERE slot_date >= CURRENT_DATE
                ORDER BY slot_date, slot_time
            """)
            slots = cur.fetchall()
            
            result = [{
                'id': row[0],
                'date': row[1].isoformat(),
                'time': str(row[2]),
                'available': row[3]
            } for row in slots]
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps(result),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            data = json.loads(event.get('body', '{}'))
            slot_date = data.get('date')
            slot_time = data.get('time')
            
            cur.execute("""
                INSERT INTO time_slots (slot_date, slot_time, is_available)
                VALUES (%s, %s, true)
                ON CONFLICT (slot_date, slot_time) DO NOTHING
                RETURNING id
            """, (slot_date, slot_time))
            
            result = cur.fetchone()
            conn.commit()
            
            if result:
                return {
                    'statusCode': 201,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'id': result[0], 'message': 'Слот создан'}),
                    'isBase64Encoded': False
                }
            else:
                return {
                    'statusCode': 409,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Слот уже существует'}),
                    'isBase64Encoded': False
                }
        
        elif method == 'PUT':
            data = json.loads(event.get('body', '{}'))
            slot_id = data.get('id')
            is_available = data.get('available')
            
            cur.execute("""
                UPDATE time_slots 
                SET is_available = %s
                WHERE id = %s
            """, (is_available, slot_id))
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'message': 'Слот обновлен'}),
                'isBase64Encoded': False
            }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
    finally:
        cur.close()
        conn.close()
