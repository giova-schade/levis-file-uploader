import pandas as pd 
def validate(value):
    if isinstance(value, float) and pd.isna(value):
        return False, "El campo no puede estar vacío"
    
    if not str(value).strip():
        return False, "El campo no puede estar vacío"
    
    return True, None
