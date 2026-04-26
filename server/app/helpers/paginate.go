package helpers

import (
	"reflect"
	"strconv"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

type ResponsePaginate struct {
	Total       int64       `json:"total"`
	Rows        interface{} `json:"rows"`
	CurrentPage int         `json:"currentPage"`
	PerPage     int         `json:"perPage"`
	From        int         `json:"from"`
	To          int         `json:"to"`
	LastPage    int         `json:"lastPage"`
}

type Paginate struct {
	Model interface{}
	Type  *string // ini untuk tipe yang soft delete atau engga
}

func (p *Paginate) Paginate(query *gorm.DB, e echo.Context) ResponsePaginate {
	page := 1
	limit := 10

	if pg := e.QueryParam("page"); pg != "" {
		if p, err := strconv.Atoi(pg); err == nil && p > 0 {
			page = p
		}
	}
	if l := e.QueryParam("limit"); l != "" {
		limit, _ = strconv.Atoi(l)
	}

	offset := (page - 1) * limit

	var totalRecords int64
	if p.Type == nil {
		query.Count(&totalRecords)
	} else {
		query.Unscoped().Count(&totalRecords)
	}

	modelType := reflect.TypeOf(p.Model)
	if modelType.Kind() == reflect.Ptr {
		modelType = modelType.Elem()
	}

	sliceType := reflect.SliceOf(modelType)
	slicePtr := reflect.New(sliceType).Interface()

	if p.Type == nil {
		query.Limit(limit).Offset(offset).Find(slicePtr)
	} else {
		query.Unscoped().Limit(limit).Offset(offset).Find(slicePtr)
	}

	sliceValue := reflect.ValueOf(slicePtr).Elem()
	length := sliceValue.Len()

	totalPages := int(totalRecords) / limit
	if int(totalRecords)%limit != 0 {
		totalPages++
	}

	from := offset + 1
	to := offset + length
	if to > int(totalRecords) {
		to = int(totalRecords)
	}

	if length == 0 {
		from = 0
		to = 0
	}

	return ResponsePaginate{
		Total:       totalRecords,
		Rows:        sliceValue.Interface(),
		CurrentPage: page,
		PerPage:     limit,
		From:        from,
		To:          to,
		LastPage:    totalPages,
	}
}
